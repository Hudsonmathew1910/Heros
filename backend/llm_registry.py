"""
backend/llm_registry.py
-----------------------
Loads backend/llm_models.json — the single place where Heros' LLM model names live.

    from backend import llm_registry as llm
    llm.get("groq", "zuno_intent")          -> ["allam-2-7b", ...]
    llm.baymax_models()                     -> the dict Baymax uses as self.models
    llm.iter_models()                       -> every (provider, slot, model) — used by
                                               the availability check / weekly automation
"""

import copy
import json
import os
from functools import lru_cache

MODELS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "llm_models.json")
PROVIDERS = ("gemini", "openrouter", "groq", "huggingface")


@lru_cache(maxsize=1)
def _load() -> dict:
    with open(MODELS_FILE, encoding="utf-8") as f:
        return json.load(f)


def reload() -> None:
    """Forget the cached file (after it has been edited)."""
    _load.cache_clear()


def get(provider: str, slot: str):
    """A model id, list or dict from one provider section (a copy — safe to mutate)."""
    return copy.deepcopy(_load()[provider][slot])


def baymax_models() -> dict:
    """Builds the exact shape Baymax expects for self.models."""
    data = _load()
    tasks = {}
    for p in PROVIDERS:
        tasks.update(data[p].get("baymax_tasks", {}))
    return copy.deepcopy({
        **tasks,
        "fallback": data["openrouter"]["baymax_fallback"],
        "fallback_with_groq": data["groq"]["baymax_fallback"],
        "fallback_with_gemini": data["gemini"]["baymax_fallback"],
        "fallback_with_gemini_fast": data["gemini"]["baymax_fallback_fast"],
    })


def developer_mode_models() -> dict:
    """Model lists shown in the chat page's Developer mode picker."""
    return {
        "openrouter": get("openrouter", "baymax_fallback"),
        "groq": get("groq", "baymax_fallback"),
        "gemini": get("gemini", "baymax_fallback"),
    }


def iter_models():
    """Yields (provider, slot_path, model_id) for every model in the file."""
    data = _load()

    def walk(provider, path, value):
        if isinstance(value, str):
            yield provider, path, value
        elif isinstance(value, list):
            for i, v in enumerate(value):
                yield from walk(provider, f"{path}[{i}]", v)
        elif isinstance(value, dict):
            for k, v in value.items():
                yield from walk(provider, f"{path}.{k}" if path else k, v)

    for p in PROVIDERS:
        yield from walk(p, "", data.get(p, {}))
