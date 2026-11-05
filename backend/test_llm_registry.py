"""Offline checks for backend/llm_models.json — the single source of model names."""

import os
import re
from pathlib import Path

from django.test import SimpleTestCase

from backend import llm_registry

PROJECT = Path(__file__).resolve().parent.parent
CODE_DIRS = ["backend", "infinsight", "zuno"]
# Quoted model ids that should only ever appear in llm_models.json
MODEL_ID = re.compile(
    r"""["'](gemini-\d[\w.\-]*|openai/gpt-oss[\w.\-]*|allam-[\w\-]+|whisper-[\w\-]+|"""
    r"""(?:meta-llama|nvidia|qwen|Qwen|mistralai|CohereForAI|google)/[\w.\-:]+)["']"""
)
ALLOWED = {
    "backend/llm_registry.py",            # docstring example
    "infinsight/models.py",               # DB default label, not a model call
    "backend/usage_tracker.py",           # pricing table labels
}


class LLMRegistryTests(SimpleTestCase):
    def test_file_loads_and_has_all_providers(self):
        providers = {p for p, _, _ in llm_registry.iter_models()}
        self.assertEqual(providers, set(llm_registry.PROVIDERS))

    def test_baymax_shape(self):
        m = llm_registry.baymax_models()
        for key in ("text_chat", "voice_chat", "coding", "task_automation", "zeno_shadow",
                    "fallback", "fallback_with_groq", "fallback_with_gemini", "fallback_with_gemini_fast"):
            self.assertIn(key, m)
        for key in ("fallback", "fallback_with_groq", "fallback_with_gemini", "fallback_with_gemini_fast"):
            self.assertIsInstance(m[key], list)
            self.assertTrue(m[key], key)

    def test_autoreplace_replaces_and_avoids_duplicates(self):
        from backend.llm_autoreplace import apply_replacement
        data = {"openrouter": {
            "tasks": {"a": "old:free"},
            "list1": ["x:free", "old:free", "y:free"],
            "list2": ["new:free", "old:free"],     # replacement already present → just drop old
        }, "groq": {"same": "old:free"}}
        apply_replacement(data, "openrouter", "old:free", "new:free")
        self.assertEqual(data["openrouter"]["tasks"]["a"], "new:free")
        self.assertEqual(data["openrouter"]["list1"], ["x:free", "new:free", "y:free"])  # order kept
        self.assertEqual(data["openrouter"]["list2"], ["new:free"])
        self.assertEqual(data["groq"]["same"], "old:free")  # other providers untouched

    def test_autoreplace_candidate_rules(self):
        from unittest import mock
        from backend import llm_autoreplace as a
        fake = {
            "google/gemma-3-12b-it:free": {"context": 32000, "free": True, "output": ["text"]},
            "google/gemma-3-12b-it": {"context": 32000, "free": False, "output": ["text"]},   # paid
            "stealth/thing-alpha": {"context": 99000, "free": True, "output": ["text"]},     # temporary
            "meta/llama-x:free": {"context": 4000, "free": True, "output": ["text"]},         # context too small
            "acme/image-gen:free": {"context": 32000, "free": True, "output": ["image"]},     # not text
        }
        with mock.patch.object(a.cat, "catalogue", return_value=fake):
            got = a.candidates("openrouter", "google/gemma-2-9b-it:free", in_use=set())
        self.assertEqual(got, ["google/gemma-3-12b-it:free"])

    def test_autoreplace_removes_dead_model_only_from_lists(self):
        from backend.llm_autoreplace import apply_removal, removable
        data = {"openrouter": {"fallback": ["a:free", "dead:free", "b:free"], "only": ["dead:free"]}}
        apply_removal(data, "openrouter", "dead:free")
        self.assertEqual(data["openrouter"]["fallback"], ["a:free", "b:free"])
        self.assertEqual(data["openrouter"]["only"], ["dead:free"])   # never leave a list empty
        self.assertTrue(removable(["baymax_fallback[1]"]))
        self.assertFalse(removable(["baymax_tasks.task_automation", "baymax_fallback[0]"]))  # a task needs a model

    def test_autoreplace_rejects_poor_and_preview_matches(self):
        from unittest import mock
        from backend import llm_autoreplace as a
        fake = {
            "google/gemma-4-26b-it:free": {"context": 128000, "free": True, "output": ["text"]},
            "dots/dots-note-preview:free": {"context": 128000, "free": True, "output": ["text"]},  # preview
            "acme/safety-checker:free": {"context": 128000, "free": True, "output": ["text"]},     # safety model
            "acme/code-helper:free": {"context": 128000, "free": True, "output": ["text"]},        # coding model
            "random/flint-v1:free": {"context": 128000, "free": True, "output": ["text"]},         # poor match
        }
        with mock.patch.object(a.cat, "catalogue", return_value=fake):
            got = a.candidates("openrouter", "google/gemma-2-9b-it:free", in_use=set())
        self.assertEqual(got, ["google/gemma-4-26b-it:free"])

    def test_no_hardcoded_model_names_outside_registry(self):
        offenders = []
        for d in CODE_DIRS:
            for path in (PROJECT / d).rglob("*.py"):
                rel = path.relative_to(PROJECT).as_posix()
                if rel in ALLOWED or "/migrations/" in rel or path.name.startswith("test"):
                    continue
                for i, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
                    if line.lstrip().startswith("#"):
                        continue
                    for m in MODEL_ID.findall(line):
                        offenders.append(f"{rel}:{i}  {m}")
        self.assertEqual(offenders, [], "Move these model names into backend/llm_models.json:\n" + "\n".join(offenders))
