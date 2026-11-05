"""
Live check: do the LLM models Heros uses still exist at their providers?

Covers all 4 providers — Hugging Face (Halo), Gemini, Groq, OpenRouter.
Model lists are read from backend/llm_models.json — the single file every part
of Heros (Baymax / Halo / Infinsight / Zuno / Developer mode) reads its models from.

It only checks that each model EXISTS / is SERVED by the provider (model-list
APIs, no generation calls), so it costs no tokens and no quota.
To also replace removed models automatically, see backend/llm_autoreplace.py.

Run (makes real network calls, uses API keys from .env):
    python backend/test_llm_availability.py
or through Django (skipped unless enabled, so normal test runs stay offline):
    RUN_LIVE_MODEL_CHECKS=1 python manage.py test backend.test_llm_availability
"""

import os
import sys
import unittest
from collections import defaultdict

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    try:
        from dotenv import load_dotenv
        load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
    except ImportError:
        pass

from backend import llm_catalogue as cat  # noqa: E402
from backend import llm_registry          # noqa: E402

LIVE = os.getenv("RUN_LIVE_MODEL_CHECKS") == "1" or __name__ == "__main__"


def collect_models() -> dict:
    """Returns {provider: {model_id: set(where used)}} from backend/llm_models.json."""
    used = defaultdict(lambda: defaultdict(set))
    for provider, slot, model in llm_registry.iter_models():
        used[provider][model].add(slot)
    return used


@unittest.skipUnless(LIVE, "Live model checks are off. Set RUN_LIVE_MODEL_CHECKS=1 to run.")
class LLMModelAvailabilityTests(unittest.TestCase):
    """One sub-test per model, so every missing model is reported (not just the first)."""

    @classmethod
    def setUpClass(cls):
        cls.used = collect_models()
        cls.report = []  # (provider, model, ok, detail, where)

    @classmethod
    def tearDownClass(cls):
        print_report(cls.report)

    def _check(self, provider):
        models = self.used[provider]
        if provider == "huggingface":
            lookup = cat.hf_status
        else:
            try:
                catalogue = cat.catalogue(provider)
            except Exception as e:
                if "No working" in str(e) and not cat.keys_for(provider):
                    self.skipTest(str(e))
                self.fail(f"{provider}: could not fetch model list — {e}")

            def lookup(m):
                return (True, "available") if m in catalogue else (False, "NOT FOUND at provider")

        for model, where in sorted(models.items()):
            try:
                ok, detail = lookup(model)
            except Exception as e:
                ok, detail = False, f"check failed — {e}"
            self.report.append((provider, model, ok, detail, where))
            with self.subTest(provider=provider, model=model):
                self.assertTrue(ok, f"{model} ({', '.join(sorted(where))}) — {detail}")

    def test_gemini(self):
        self._check("gemini")

    def test_groq(self):
        self._check("groq")

    def test_openrouter(self):
        self._check("openrouter")

    def test_huggingface(self):
        self._check("huggingface")


def print_report(rows):
    if not rows:
        return
    out = sys.stderr
    out.write("\n\n" + "=" * 100 + "\nLLM MODEL AVAILABILITY REPORT\n" + "=" * 100 + "\n")
    for provider in llm_registry.PROVIDERS:
        prows = [r for r in rows if r[0] == provider]
        if not prows:
            continue
        ok_n = sum(1 for r in prows if r[2])
        out.write(f"\n{provider.upper()}  ({ok_n}/{len(prows)} available)\n")
        for _, model, ok, detail, where in prows:
            mark = "OK  " if ok else "FAIL"
            out.write(f"  [{mark}] {model:<45} {detail}\n")
            if not ok:
                out.write(f"         used in: {', '.join(sorted(where))}\n")
    if cat.REJECTED_KEYS:
        out.write("\nREJECTED API KEYS (fix or remove in .env):\n")
        for b in cat.REJECTED_KEYS:
            out.write(f"  - {b}\n")
    bad = [r for r in rows if not r[2]]
    out.write(f"\nTOTAL: {len(rows) - len(bad)}/{len(rows)} available, {len(bad)} missing\n" + "=" * 100 + "\n")


if __name__ == "__main__":
    unittest.main(verbosity=1)
