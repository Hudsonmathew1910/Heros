"""
backend/llm_catalogue.py
------------------------
Talks to the 4 LLM providers' public model-list APIs (no Django needed):

  • catalogue(provider)   → {model_id: metadata} of what the provider offers right now
  • hf_status(model_id)   → is a Hugging Face model actually served by an inference provider?
  • probe(provider, id)   → tiny live request ("say OK"): (ok, latency_s, detail)

Used by backend/test_llm_availability.py (weekly check) and backend/llm_autoreplace.py
(weekly auto-replacement).
"""

import os
import time

import requests

TIMEOUT = 20

# Env var names checked for each provider's key, in order.
KEY_ENV = {
    "gemini": ["GEMINI_API_KEY", "Gemini_K1", "Gemini_K2"],
    "groq": ["GROQ_API_KEY", "Groq_1", "Groq_2"],
    "openrouter": ["OPENROUTER_API_KEY", "Openrouter_k1"],
    "huggingface": ["HF_TOKEN", "HF_TOKEN_1", "HF_TOKEN_2", "HF_TOKEN_3"],
}

REJECTED_KEYS = []  # "provider: ENV_NAME rejected (401)" — filled while fetching


def _clean(v):
    return v.strip().strip("'\"") if v else v


def keys_for(provider):
    """[(env_name, key)] that are set, in priority order."""
    out = []
    for n in KEY_ENV[provider]:
        v = _clean(os.getenv(n))
        if v:
            out.append((n, v))
    return out


_working_key = {}


def working_key(provider):
    """First key the provider accepts (cached). None if none set / all rejected."""
    if provider in _working_key:
        return _working_key[provider]
    found = None
    for name, key in keys_for(provider):
        try:
            _fetch_raw(provider, key)
            found = key
            break
        except requests.HTTPError as e:
            code = e.response.status_code if e.response is not None else "?"
            if code in (400, 401, 403):
                REJECTED_KEYS.append(f"{provider}: {name} rejected ({code})")
                continue
            raise
    _working_key[provider] = found
    return found


# ─────────────────────────────────────────────────────────────────────────────
# Catalogues
# ─────────────────────────────────────────────────────────────────────────────

def _fetch_raw(provider, key):
    if provider == "gemini":
        models, token = [], None
        while True:
            params = {"key": key, "pageSize": 1000}
            if token:
                params["pageToken"] = token
            r = requests.get("https://generativelanguage.googleapis.com/v1beta/models", params=params, timeout=TIMEOUT)
            r.raise_for_status()
            data = r.json()
            models += data.get("models", [])
            token = data.get("nextPageToken")
            if not token:
                return models
    if provider == "groq":
        r = requests.get("https://api.groq.com/openai/v1/models",
                         headers={"Authorization": f"Bearer {key}"}, timeout=TIMEOUT)
        r.raise_for_status()
        return r.json().get("data", [])
    if provider == "openrouter":
        headers = {"Authorization": f"Bearer {key}"} if key else {}
        r = requests.get("https://openrouter.ai/api/v1/models", headers=headers, timeout=TIMEOUT)
        r.raise_for_status()
        return r.json().get("data", [])
    raise ValueError(provider)


_catalogue_cache = {}


def catalogue(provider):
    """{model_id: metadata}. Raises RuntimeError if it cannot be fetched."""
    if provider in _catalogue_cache:
        return _catalogue_cache[provider]
    if provider == "huggingface":
        raise ValueError("Hugging Face has no single catalogue — use hf_status / hf_candidates")

    if provider == "openrouter":
        key = working_key(provider) if keys_for(provider) else None
        raw = _fetch_raw(provider, key)  # public endpoint, key optional
    else:
        key = working_key(provider)
        if not key:
            raise RuntimeError(f"No working {provider} API key (set one of {', '.join(KEY_ENV[provider])})")
        raw = _fetch_raw(provider, key)

    out = {}
    for m in raw:
        if provider == "gemini":
            mid = m["name"].replace("models/", "")
            out[mid] = {
                "methods": m.get("supportedGenerationMethods", []),
                "context": m.get("inputTokenLimit") or 0,
                "name": m.get("displayName", ""),
            }
        elif provider == "groq":
            out[m["id"]] = {
                "owner": m.get("owned_by", ""),
                "context": m.get("context_window") or 0,
                "active": m.get("active", True),
            }
        elif provider == "openrouter":
            pricing = m.get("pricing") or {}
            arch = m.get("architecture") or {}
            out[m["id"]] = {
                "context": m.get("context_length") or 0,
                "free": m["id"].endswith(":free") or (
                    str(pricing.get("prompt")) in ("0", "0.0") and str(pricing.get("completion")) in ("0", "0.0")),
                "output": arch.get("output_modalities") or ["text"],
                "input": arch.get("input_modalities") or ["text"],
            }
    _catalogue_cache[provider] = out
    return out


def hf_status(model_id):
    """(ok, detail). A Hub model can exist without being served — Halo needs it served ("live")."""
    key = working_key_hf()
    headers = {"Authorization": f"Bearer {key}"} if key else {}
    r = requests.get(f"https://huggingface.co/api/models/{model_id}",
                     params={"expand[]": "inferenceProviderMapping"}, headers=headers, timeout=TIMEOUT)
    if r.status_code in (401, 404):
        return False, "not found on the Hub"
    r.raise_for_status()
    mapping = r.json().get("inferenceProviderMapping") or {}
    items = mapping.items() if isinstance(mapping, dict) else [(m.get("provider"), m) for m in mapping]
    live = [p for p, info in items if (info or {}).get("status") == "live"]
    chat = [p for p, info in items
            if (info or {}).get("status") == "live" and (info or {}).get("task") in (None, "conversational")]
    if chat:
        return True, "served by " + ", ".join(sorted(chat))
    if live:
        return False, "served, but not as a chat model"
    return False, "exists on the Hub but no inference provider serves it"


def working_key_hf():
    keys = keys_for("huggingface")
    return keys[0][1] if keys else None


def hf_candidates(limit=300):
    """Chat/text-generation models currently served by HF inference providers, most-used first."""
    key = working_key_hf()
    headers = {"Authorization": f"Bearer {key}"} if key else {}
    r = requests.get("https://huggingface.co/api/models", headers=headers, timeout=TIMEOUT, params={
        "inference_provider": "all",
        "pipeline_tag": "text-generation",
        "sort": "downloads",
        "limit": limit,
        "expand[]": ["inferenceProviderMapping"],
    })
    r.raise_for_status()
    out = {}
    for m in r.json():
        mapping = m.get("inferenceProviderMapping") or {}
        items = mapping.items() if isinstance(mapping, dict) else [(x.get("provider"), x) for x in mapping]
        providers = [p for p, info in items
                     if (info or {}).get("status") == "live" and (info or {}).get("task") == "conversational"]
        if m.get("id") and providers:
            out[m["id"]] = {"providers": providers}
    return out  # {model_id: {"providers": [...]}} — only models served as chat models


# ─────────────────────────────────────────────────────────────────────────────
# Live probe — one tiny request
# ─────────────────────────────────────────────────────────────────────────────

PROMPT = "Reply with the single word OK."


def probe(provider, model_id):
    """(ok, latency_seconds, detail). Uses a handful of tokens."""
    t0 = time.time()
    try:
        if provider == "gemini":
            key = working_key("gemini")
            r = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent",
                params={"key": key}, timeout=60,
                json={"contents": [{"parts": [{"text": PROMPT}]}], "generationConfig": {"maxOutputTokens": 50}})
        elif provider in ("groq", "openrouter", "huggingface"):
            if provider == "groq" and model_id.startswith("whisper"):
                return True, 0.0, "speech model — listed by provider (not chat-tested)"
            url = {
                "groq": "https://api.groq.com/openai/v1/chat/completions",
                "openrouter": "https://openrouter.ai/api/v1/chat/completions",
                "huggingface": "https://router.huggingface.co/v1/chat/completions",
            }[provider]
            key = working_key_hf() if provider == "huggingface" else working_key(provider)
            if not key:
                return False, 0.0, f"no {provider} key to test with"
            r = requests.post(url, timeout=60, headers={"Authorization": f"Bearer {key}"}, json={
                "model": model_id, "max_tokens": 20,
                "messages": [{"role": "user", "content": PROMPT}],
            })
        else:
            raise ValueError(provider)
    except requests.RequestException as e:
        return False, time.time() - t0, f"network error: {e}"
    latency = time.time() - t0
    if r.status_code == 200:
        return True, latency, "answered"
    return False, latency, f"HTTP {r.status_code}: {r.text[:150]}"
