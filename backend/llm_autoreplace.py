"""
backend/llm_autoreplace.py
--------------------------
Weekly robot: finds LLM models in backend/llm_models.json that a provider has
removed, picks a working replacement from the SAME provider, live-tests it,
and (with --apply) writes it into llm_models.json.

    python backend/llm_autoreplace.py                 # dry run: report only
    python backend/llm_autoreplace.py --apply         # also update llm_models.json
    python backend/llm_autoreplace.py --apply --report report.md

How a replacement is chosen (per provider):
  1. Only models the provider lists right now, that can chat (no embedding/TTS/image…).
  2. OpenRouter: a removed FREE model is only replaced by another FREE model.
     Groq: a speech model (whisper) only by another whisper model.
  3. Ranked by similarity: same vendor, same family words (flash/lite/llama/coder…),
     newer version, larger context.
  4. The best candidates get a tiny live request ("say OK"); the first that answers wins.
If nothing qualifies, the model is left as is and listed under "needs attention".

Exit code: 0 = nothing missing or everything replaced, 1 = something needs attention.
Writes changed=true/false and unresolved=N to $GITHUB_OUTPUT when run in GitHub Actions.
"""

import argparse
import json
import os
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

try:  # local runs: read keys from hero_ai/.env (GitHub Actions passes them as env vars)
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(HERE), ".env"))
except ImportError:
    pass

from backend import llm_catalogue as cat          # noqa: E402
from backend import llm_registry                   # noqa: E402

MAX_PROBES = 5  # live-test at most this many candidates per removed model

# Never offer these as a chat-model replacement
NOT_CHAT = re.compile(
    r"embed|tts|audio|image|imagen|veo|vision-only|live|aqa|learnlm|robotics|computer-use|"
    r"guard|moderation|whisper|distil|orpheus|playai|compound|rerank|transcri|native-audio",
    re.I,
)
UNSTABLE = re.compile(r"preview|exp(erimental)?\b|-exp-|alpha|beta|\d{2}-\d{2}$", re.I)
# Temporary / meta "models" that must never be picked
SKIP_VENDORS = {"stealth", "openrouter"}
# Hugging Face: only official publishers (no community remixes / quantized re-uploads)
HF_OFFICIAL = {"meta-llama", "mistralai", "qwen", "google", "microsoft", "deepseek-ai", "coherelabs",
               "cohereforai", "nvidia", "ibm-granite", "huggingfacetb", "allenai", "moonshotai",
               "zai-org", "openai", "tiiuae", "01-ai", "baidu", "minimaxai"}
HF_JUNK = re.compile(r"uncensor|abliterat|heretic|gguf|awq|gptq|exl2|nsfw|lenient|merge|\brp\b", re.I)
CHATTY = re.compile(r"instruct|chat|-it\b|_it\b|-it-", re.I)
FAMILY_WORDS = {"lite", "flash", "pro", "mini", "nano", "coder", "code", "instruct", "chat", "it",
                "llama", "gemma", "qwen", "mistral", "nemo", "mixtral", "nemotron", "gpt", "oss",
                "deepseek", "command", "phi", "super", "ultra", "lightning"}


# ─────────────────────────────────────────────────────────────────────────────
# Similarity ranking
# ─────────────────────────────────────────────────────────────────────────────

def _words(model_id):
    base = model_id.split(":")[0].lower()
    return set(re.split(r"[/\-_.]+", base)) - {""}


def _vendor(model_id):
    return model_id.split("/")[0].lower() if "/" in model_id else ""


def _version(model_id):
    nums = re.findall(r"\d+(?:\.\d+)?", model_id.split("/")[-1])
    try:
        return max(float(n) for n in nums if float(n) < 100) if nums else 0.0
    except ValueError:
        return 0.0


def _size_b(model_id):
    m = re.search(r"(\d+(?:\.\d+)?)b\b", model_id.lower())
    return float(m.group(1)) if m else None


def score(old, cand, meta=None):
    meta = meta or {}
    ow, cw = _words(old), _words(cand)
    s = 0.0
    if _vendor(old) and _vendor(old) == _vendor(cand):
        s += 3
    fam_old, fam_new = ow & FAMILY_WORDS, cw & FAMILY_WORDS
    s += 2 * len(fam_old & fam_new) - 1.5 * len(fam_old ^ fam_new)
    s += len(ow & cw) * 0.3
    s += min(_version(cand), 20) * 0.05          # prefer newer
    so, sc = _size_b(old), _size_b(cand)
    if so and sc:                                 # similar size (speed/cost)
        s -= abs((sc - so) / max(so, 1)) * 1.0
    s += min((meta.get("context") or 0) / 1_000_000, 1) * 0.5
    s += min(len(meta.get("providers", [])), 4) * 0.8   # HF: served by several providers = reliable
    if UNSTABLE.search(cand):
        s -= 2                                    # previews disappear quickly
    return s


# ─────────────────────────────────────────────────────────────────────────────
# Candidates per provider
# ─────────────────────────────────────────────────────────────────────────────

def candidates(provider, old, in_use):
    """Ranked list of replacement ids (best first)."""
    if provider == "huggingface":
        pool = cat.hf_candidates()
    else:
        pool = cat.catalogue(provider)

    out = []
    for mid, meta in pool.items():
        if mid == old or mid in in_use:
            continue
        if provider == "huggingface":
            if _vendor(mid) not in HF_OFFICIAL or HF_JUNK.search(mid) or not CHATTY.search(mid):
                continue
        if provider == "groq" and old.startswith("whisper"):
            if not mid.startswith("whisper") or not meta.get("active", True):
                continue
        else:
            if NOT_CHAT.search(mid):
                continue
            if provider == "gemini":
                if not mid.startswith("gemini") or "generateContent" not in meta.get("methods", []):
                    continue
            if provider == "groq" and not meta.get("active", True):
                continue
            if provider == "openrouter":
                if _vendor(mid) in SKIP_VENDORS or re.search(r"alpha|beta", mid, re.I):
                    continue
                if "text" not in meta.get("output", ["text"]):
                    continue
                if old.endswith(":free") and not mid.endswith(":free"):
                    continue                       # never turn a free model into a paid one
                if (meta.get("context") or 0) < 8000:
                    continue
        out.append(mid)
    out.sort(key=lambda m: score(old, m, pool.get(m)), reverse=True)
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Find missing models
# ─────────────────────────────────────────────────────────────────────────────

def find_missing():
    """[(provider, model, [slots])] for models the provider no longer offers."""
    by_model = defaultdict(list)
    for provider, slot, model in llm_registry.iter_models():
        by_model[(provider, model)].append(slot)

    missing, errors = [], []
    for (provider, model), slots in sorted(by_model.items()):
        try:
            if provider == "huggingface":
                ok, _ = cat.hf_status(model)
            else:
                ok = model in cat.catalogue(provider)
        except Exception as e:
            errors.append(f"{provider}: could not check `{model}` — {e}")
            continue
        if not ok:
            missing.append((provider, model, slots))
    return missing, errors, len(by_model)


def choose_replacement(provider, old, taken=()):
    in_use = {m for p, _, m in llm_registry.iter_models() if p == provider} | set(taken)
    tried = []
    for cand in candidates(provider, old, in_use)[:MAX_PROBES]:
        ok, latency, detail = cat.probe(provider, cand)
        if ok:
            return cand, latency, tried
        if "HTTP 402" in detail or "HTTP 401" in detail:
            # Account problem, not a model problem — no candidate can pass, so stop here.
            tried.append(f"**{provider} account cannot run any model** ({detail[:110]}). "
                         "Add credits / fix the key, then re-run.")
            break
        if "not supported by any provider you have enabled" in detail:
            detail = "served only by an inference provider not enabled in your HF settings"
        tried.append(f"`{cand}` ({detail[:80]})")
    return None, None, tried


# ─────────────────────────────────────────────────────────────────────────────
# Apply to llm_models.json (provider-scoped)
# ─────────────────────────────────────────────────────────────────────────────

def apply_replacement(data, provider, old, new):
    """Replace `old` with `new` everywhere inside data[provider]. If `new` is already in
    the same list, the `old` entry is simply removed (no duplicates)."""

    def walk(node):
        if isinstance(node, dict):
            return {k: walk(v) for k, v in node.items()}
        if isinstance(node, list):
            out = []
            for v in node:
                if v == old:
                    if new not in node and new not in out:
                        out.append(new)
                else:
                    out.append(walk(v))
            return out
        return new if node == old else node

    data[provider] = walk(data[provider])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--apply", action="store_true", help="write replacements into llm_models.json")
    ap.add_argument("--report", help="write a Markdown report to this file")
    args = ap.parse_args()

    missing, errors, total = find_missing()
    replaced, unresolved = [], []

    taken = set()  # replacements already picked in this run — never reuse one
    for provider, old, slots in missing:
        try:
            new, latency, tried = choose_replacement(provider, old, taken)
            if new:
                taken.add(new)
        except Exception as e:
            new, latency, tried = None, None, [f"error: {e}"]
        if new:
            replaced.append((provider, old, new, latency, slots))
        else:
            unresolved.append((provider, old, slots, tried))

    changed = False
    if args.apply and replaced:
        with open(llm_registry.MODELS_FILE, encoding="utf-8") as f:
            data = json.load(f)
        for provider, old, new, _, _ in replaced:
            apply_replacement(data, provider, old, new)
        with open(llm_registry.MODELS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        llm_registry.reload()
        changed = True

    report = build_report(total, replaced, unresolved, errors, applied=args.apply)
    print(report)
    if args.report:
        with open(args.report, "w", encoding="utf-8") as f:
            f.write(report)

    gh_out = os.getenv("GITHUB_OUTPUT")
    if gh_out:
        with open(gh_out, "a", encoding="utf-8") as f:
            f.write(f"changed={'true' if changed else 'false'}\n")
            f.write(f"unresolved={len(unresolved) + len(errors)}\n")

    return 1 if (unresolved or errors) else 0


def build_report(total, replaced, unresolved, errors, applied):
    lines = ["## Weekly LLM model check", ""]
    lines.append(f"Checked **{total}** models across Hugging Face, Gemini, Groq and OpenRouter.")
    lines.append("")
    if not (replaced or unresolved or errors):
        lines.append("All models are still available. Nothing to change.")
    if replaced:
        verb = "Replaced" if applied else "Would replace"
        lines += [f"### {verb} {len(replaced)} removed model(s)", "",
                  "| Provider | Removed model | Replacement | Live test | Used in |",
                  "|---|---|---|---|---|"]
        for provider, old, new, latency, slots in replaced:
            lines.append(f"| {provider} | `{old}` | `{new}` | answered in {latency:.1f}s | {', '.join(slots)} |")
        lines += ["", "Please review: the robot checks that the new model **works and is fast**, "
                      "but not the **quality** of its answers. Try a few chats before merging.", ""]
    if unresolved:
        lines += [f"### Needs attention: {len(unresolved)} model(s) with no automatic replacement", ""]
        for provider, old, slots, tried in unresolved:
            lines.append(f"- **{provider}** `{old}` (used in {', '.join(slots)})")
            if tried:
                lines.append(f"  - tried: {', '.join(tried)}")
        lines.append("")
    if errors:
        lines += ["### Could not check", ""] + [f"- {e}" for e in errors] + [""]
    if cat.REJECTED_KEYS:
        lines += ["### API keys rejected by the provider", ""] + [f"- {k}" for k in cat.REJECTED_KEYS] + [""]
    return "\n".join(lines)


if __name__ == "__main__":
    sys.exit(main())
