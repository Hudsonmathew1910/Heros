# Heros Frontend Redesign — Structure Plan (v6)

Goal: turn Heros into a real consumer product with a Claude / ChatGPT-grade UI, using the logo's
palette, **without touching any backend code**. Every route, view, context variable and API stays
exactly as it is; only templates, CSS and JS change.

## 1. Constraints that shape the structure
- Views render fixed template names → keep `home.html`, `landing.html`, `platform.html`,
  `infinsight.html`, `zuno/zuno.html`, `terms_and_privacy.html`, `404.html`. New pages = new templates
  only if reachable through existing routes (no new URLs, since `urls.py` is backend).
- Existing behaviour lives in JS that targets element IDs and global `onclick` functions. The new
  JS keeps every public function name and every DOM ID, so all flows (auth, chat, voice, history,
  settings, developer mode, uploads, playground, keys, usage…) keep working.
- Django template inheritance is introduced so all pages share one design system.

## 2. Brand system (from `Hero_ai.png`)
| Token | Light | Dark | Source |
|---|---|---|---|
| Olive ink (primary) | `#353B30` | `#E3E6D6` | logo outline / features |
| Deep olive | `#242B21` | – | logo shadow |
| Sage | `#6D7266` / `#A7AA9D` | `#A7AA9D` | logo anti-alias tones |
| Bone (paper) | `#F5F6EE` bg, `#FCFCF7` surface | – | logo face `#EAECDF` |
| Dark paper | – | `#1A1D18` bg, `#22261F` surface | olive, darkened |
| Accent (interactive, hex for canvas) | `#5B7247` | `#A9BF8C` | sage-green derived |
Typography: **Newsreader** (serif display — Claude-like greetings & marketing headlines),
**Inter** (UI), **JetBrains Mono** (code). Icons: Font Awesome 6.5.1 (kept; JS emits FA classes).

## 3. File structure
```
templates/
  base.html                     # <head>, fonts, tokens, theme bootstrap, blocks
  layouts/app_shell.html        # extends base: sidebar + main (Chat, Infinsight, Zuno)
  partials/
    sidebar_brand.html          # logo + collapse button
    sidebar_features.html       # Heros Chat · Infinsight · Zuno (like Codex / Claude Code / Cowork)
    google_icon.html            # Google "G" svg
    logo_mark.html              # inline logo <img>
  landing.html                  # Heros main page (extends base)
  home.html                     # Heros Chat (extends layouts/app_shell)
  infinsight.html               # Infinsight feature (extends layouts/app_shell)
  platform.html                 # Heros Platform console (extends base, own shell)
  terms_and_privacy.html        # Legal (extends base)
  404.html                      # Not found (extends base)
zuno/templates/zuno/zuno.html   # Zuno feature (extends layouts/app_shell)

static/heros/
  css/tokens.css     # palette, type scale, radii, shadows; light + dark
  css/base.css       # reset, buttons, inputs, toggles, cards, modals, toasts, menus, util
  css/app-shell.css  # sidebar (collapsible rail / mobile drawer), topbar, model picker
  css/chat.css       # welcome, messages, composer, voice, settings, developer panel
  css/infinsight.css # datasets, upload, analysis chat, charts
  css/zuno.css       # mic stage, player, results
  css/landing.css    # marketing page
  css/platform.css   # console shell + all sections
  css/legal.css      # terms + 404
  js/theme.js        # shared theme (hero-theme), system default, toggle helpers
  js/shell.js        # sidebar collapse/drawer, dropdown menus, model picker, tooltips
  js/chat.js         # ← app.js (all logic kept; markup → new classes, no inline colours)
  js/infinsight.js   # ← inf.js
  js/zuno.js         # ← zuno inline script
  js/landing.js      # ← landing inline script (+ wires the missing "graceful" modal opener)
  js/platform.js     # ← platform inline script (Django tag removed → window.HEROS_PROJECTS)
```
Legacy `static/css/*.css`, `static/js/app.js`, `static/js/inf.js` stay on disk (untouched) but are no
longer referenced. Full originals are also archived in `_legacy_frontend_v5/`.

## 4. Pages
### 4.1 Heros (main page) — `landing.html`
Marketing site in the style of claude.com / openai.com: sticky translucent nav → serif hero with a
live product mock (chat window) → stats strip → "Four systems, one assistant" → failover tiers →
**Models** (Baymax, Halo) and **Features** (Infinsight, Zeno, Zuno) in a tabbed showcase with the
Baymax outage simulator → personas & fast mode → docs → developers → company → FAQ → changelog →
CTA → footer. Modals: API keys, login, how it fails gracefully. All v5 copy retained.

### 4.2 Heros Chat — `home.html`
ChatGPT / Claude layout:
- **Sidebar** (collapsible to an icon rail on desktop, drawer on mobile): logo, *New chat*,
  feature links **Infinsight** and **Zuno**, *Recents* (`#historyList`), account menu at the bottom
  (Settings, Platform, Discover Heros, Help, Log out) or *Sign in*.
- **Topbar**: model picker (custom dropdown driving the hidden `#modelSelect`; Baymax 4.5,
  Halo 3.6, ZORVIN, Developer Mode) with descriptions; right side Temporary chat, Developer tools,
  theme.
- **Empty state**: serif greeting + centred composer + suggestion chips (Code / Summarize / Explain / Write).
- **Conversation**: user messages in right-aligned bubbles, assistant messages full-width with an
  action row (copy, sources); code blocks with header + copy; tables, math, highlight.js.
- **Composer**: attach (+ menu), textarea, tool chips (Search, Code, Fast), Talk (inline voice),
  Wait, mute, send/mic/stop; attachment chips; scroll-to-bottom.
- Modals: Auth (sign in / create account / Google setup), Settings (11 panels, every v5 field),
  Voice conversation, Developer mode setup + Developer tools panel, Web evidence, confirm, toasts.

### 4.3 Infinsight (feature) — `infinsight.html`
Same app shell, feature highlighted. Sidebar: *New analysis*, Gemini key card, no-key banner,
*Datasets* list. Main: topbar with dataset title + type badge, processing banner, welcome with drop
zone + capability cards, analysis chat with charts, composer. Modals: auth, upload.

### 4.4 Zuno (feature) — `zuno/zuno.html`
Same app shell, feature highlighted. Main: platform switch (YT Music / YouTube), large mic orb,
status + transcript, command cards, now-playing player, search results, error card, toast.

### 4.5 Heros Platform — `platform.html`
Console in the style of console.anthropic.com / platform.openai.com: left nav with project switcher,
⌘K search and grouped sections; header with page title & actions; all 16 sections, modals and the
command palette preserved with their IDs.

### 4.6 Supporting pages
`terms_and_privacy.html` (tabbed legal page) and `404.html` re-skinned on the same tokens.

## 5. Delivery order
1. Archive v5 + content inventory (done) → 2. tokens/base/shell CSS + base templates →
3. Heros Chat → 4. Infinsight → 5. Zuno → 6. Landing → 7. Platform → 8. Legal/404 →
9. Verification: `manage.py check`, render every template, `node --check` every JS file,
headless screenshots.

## 6. Implementation status (delivered)
All pages above are built and verified (`manage.py check`, every template rendered offline,
`node --check` on every JS file, element-ID/handler cross-check, light/dark/mobile screenshots).

### Small behaviour fixes made while porting (frontend only)
- Settings › Save buttons: v5 `savePersonalization()` grabbed the first `.modal-save-btn` in the
  modal (the "Get Heros API Key" link); it now updates the button that was clicked.
- Developer Mode modal: v5 toggled `style.display` on an overlay whose visibility is class-driven;
  now uses the `.active` class like every other modal.
- Platform ⌘K "Create Secret API Key" called a missing `openGenerateKeyModal()`; aliased to `openKeyModal()`.
- Platform key show/hide button lost its icon after revealing; now swaps to an eye-slash icon.
- Landing "How it fails gracefully" modal had no opener (`#gracefulBtn` missing); button added.
- Landing CSRF: the template now renders `{% csrf_token %}` so the cookie exists for login/logout/key saves.
- Mojibake placeholders in the landing key modal (`AIza����`) fixed.
- `?model=Baymax|Halo` links from the landing page now actually pre-select the model in Heros Chat.
- `?action=signup|login` on `/` opens the sign-in sheet on the right tab.
- Unreachable duplicate modals in v5 `home.html` (`#apiKeysModal`, `#aboutHerosModal`, `#helpModal`,
  which also duplicated element IDs) were folded into the Settings panels.

### Deployment note
Production uses `CompressedManifestStaticFilesStorage`, so run `python manage.py collectstatic`
after deploying to pick up `static/heros/**`.
