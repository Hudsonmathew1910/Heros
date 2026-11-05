# Weekly LLM Model Check

Heros uses AI models from 4 providers: **Hugging Face** (Halo), **Gemini**, **Groq** and **OpenRouter**. Providers remove models without warning, and a removed model makes Heros fail or slow down.

A robot on GitHub checks all models **every Monday**. It replaces removed ones and asks you to approve the change.

---

## How it works

```
Every Monday 03:30 UTC (GitHub Actions)
        │
        ▼
1. Check every model in backend/llm_models.json at its provider
        │
        ├── all exist ──────────────► ✅ green, nothing else happens
        │
        ▼ a model was removed
2. Find a replacement from the SAME provider
3. Live-test it ("Reply with OK") — must answer
4. Edit backend/llm_models.json
5. Open a pull request "Weekly LLM model check: replace removed models"
        │
        └── can't fix something ───► ❌ red + email from GitHub
```

The robot **never changes the live site by itself**. You approve every change by merging its pull request.

---

## What you do

| You see | Meaning | Action |
|---|---|---|
| ✅ Green tick, no pull request | All models are fine | Nothing |
| 📬 New pull request | A model was removed and a tested replacement is ready | Read the table (old → new), **Merge**, **deploy**, try a few chats |
| ❌ Red cross + email | Something needs a human (see below) | Open the run, read the summary, fix it |

### Why a run can turn red

| Cause | Example | Fix |
|---|---|---|
| A key stopped working | Expired or deleted key, or no credits left | Make a new key or add credits, then update the GitHub secret |
| Hugging Face 403 | `HF_TOKEN` lacks permission | New fine-grained token with **"Make calls to Inference Providers"** |
| No good replacement | The provider has nothing similar | Pick a model by hand in `llm_models.json` |
| Provider outage | Gemini or Groq is down that day | Re-run later: **Actions → Weekly LLM model check → Run workflow** |

---

## Files

| File | Purpose |
|---|---|
| `backend/llm_models.json` | **Every model name Heros uses**, the only place to change models |
| `backend/llm_registry.py` | Loads that file for Baymax, Halo, Infinsight, Zuno and Developer mode |
| `backend/llm_catalogue.py` | Talks to the providers: model lists, live tests, key checks |
| `backend/llm_autoreplace.py` | The robot: finds removed models, picks and tests replacements, writes the report |
| `backend/test_llm_availability.py` | Manual live check that prints a report of every model |
| `backend/test_llm_registry.py` | Offline tests: rules, and "no model names hard-coded in the code" |
| `.github/workflows/llm-model-check.yml` | The weekly GitHub schedule |

Not in `llm_models.json` on purpose: the Infinsight **embedding** models (`infinsight/Embedding.py`). Changing them means re-indexing every uploaded file in Pinecone.

---

## How a replacement is chosen

1. **Same provider:** a Groq model is replaced by a Groq model.
2. **It must be a chat model:** never an embedding, TTS, image, safety-filter or guard model.
3. **No surprise costs:** a **free** OpenRouter model is replaced only by another `:free` model.
4. **No temporary models:** preview, alpha, beta and "stealth" models are skipped.
5. **Hugging Face:** official publishers only (Meta, Mistral, Qwen, Google…), chat-tuned, no community remixes.
6. **Ranking:** same publisher and family first, then newer version, similar size, and more providers serving it.
7. **Minimum quality:** poor matches are never picked; the robot reports them instead.
8. **Live test:** the model must answer. Busy models (HTTP 429/503) are retried. A strong match that stays busy is still proposed, marked "busy during test".
9. **No duplicates:** the same replacement is never used twice.
10. **Dead backup model with no good replacement:** it is **removed from the list**, because the other backups cover it.

The robot checks that a model **works and is fast**, not how **good** its answers are. Always try a few chats after merging.

---

## Run it yourself

```bash
# On GitHub: Actions → Weekly LLM model check → Run workflow

# On your PC (in hero_ai/, uses keys from .env):
python backend/test_llm_availability.py           # report only: which models exist
python backend/llm_autoreplace.py                 # dry run: what it WOULD replace
python backend/llm_autoreplace.py --apply         # also edit llm_models.json
```

Normal `python manage.py test` skips the live checks, so it makes no network calls.

---

## Setup (already done, for reference)

GitHub repo **Hudsonmathew1910/Heros** → **Settings**:

- **Secrets and variables → Actions:** one key per provider
  - `GEMINI_API_KEY` (from `.env` `Gemini_K1`)
  - `GROQ_API_KEY` (from `.env` `Groq_2`; `Groq_1`, `Fast_groq` and `Groq_Flow_1` were rejected by Groq)
  - `OPENROUTER_API_KEY` (from `.env` `Openrouter_k1`)
  - `HF_TOKEN` (needs the **"Make calls to Inference Providers"** permission)
- **Actions → General → Workflow permissions:** **Read and write** + **Allow GitHub Actions to create and approve pull requests**

When you change an API key, update it in **3 places**: the GitHub secret, `hero_ai/.env`, and the server.

---

## History

| Date | What happened |
|---|---|
| 2026-11-05 | Robot set up. First run replaced `gemma-2-9b` → `gemma-4-26b`, `nemotron-3-super` → `nemotron-3.5-super-vl`, `gemini-1.5-flash` → `gemini-flash-lite-latest`, and removed `llama-3.2-3b` from the OpenRouter backups (PR #4). Halo's `command-r-plus` → `Llama-3.3-70B` and `Mistral-Nemo` → `Llama-3.1-8B` were picked by hand (PR #6). |

**Open issue (2026-11-05):** the Hugging Face account has **no credits**, and the token lacks the Inference Providers permission, so **Halo cannot answer**. Baymax (Gemini, Groq, OpenRouter) is unaffected.
