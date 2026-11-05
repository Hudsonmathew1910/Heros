# Heros — Frontend Content & Context Inventory (v5 / "Heros 5th Gen")

> Snapshot of **everything the frontend contained before the redesign**: every page, section, button,
> setting, modal, text block, ID/handler hook, API call, and client-side storage key.
> The original files are preserved byte-for-byte in `hero_ai/_legacy_frontend_v5/`.

---

## 0. Map of the frontend

| Route | Django view | Template | CSS | JS |
|---|---|---|---|---|
| `/` | `backend.views.home` | `templates/home.html` (Heros Chat) | `style.css`, `style_m.css` + inline | `static/js/app.js` + inline (inline-voice toggle) |
| `/landing/` | `backend.views.landing` | `templates/landing.html` (marketing / main page) | `landing.css` | inline (~23 KB) |
| `/platform/` | `backend.views.platform_view` (redirects to `/` if logged out) | `templates/platform.html` | `platform.css` + inline | inline (~142 KB) |
| `/infinsight/` | `infinsight.views.infinsight_page` | `templates/infinsight.html` | `style.css`, `inf.css`, `inf_m.css` + inline | `static/js/inf.js` + Chart.js |
| `/zuno/` | `zuno.views.index` (redirects to `/` if logged out) | `zuno/templates/zuno/zuno.html` | inline | inline (~15 KB) |
| `/privacy`, `/terms` | `backend.views.privacy_view` | `templates/terms_and_privacy.html` | inline | inline (tabs) |
| any unknown URL | `backend.views.custom_404` | `templates/404.html` | inline | – |
| `/admin/` | Django admin (Jazzmin) | `templates/admin/index.html` (staff "Executive Command Center") | inline | – |

**Template context variables**
- `home.html`: `username`, `email`, `error` (Google callback failure), `request.session.user_id`, `csrf_token`.
- `landing.html`: `is_authenticated`.
- `platform.html`: `user` (`name`, `email`), `setting` (`company_name`, `user_role`), `projects` (`project_id`, `name`).
- `infinsight.html`: `username`.
- `zuno.html`: `groq_missing` (bool).

**Brand assets** — `static/images/Hero_ai.png` (logo: geometric fox/cat face, olive `#353B30` on bone `#EAECDF`), `ai.png`, `leo.png` (album art used in Zuno landing mock).

**Third-party frontend libs** — Google Fonts (Inter, Plus Jakarta Sans, JetBrains Mono, Newsreader), Font Awesome 6.5.1 (6.4.0 on 404), KaTeX 0.16.11 + auto-render, highlight.js 11.9.0 (github-dark), Chart.js (Infinsight).

**Client storage keys (localStorage)** — `hero-theme`, `hero-auto-read`, `hero-compact-layout`, `hero-remember-history`, `hero-syntax-highlight`, `hero-custom-inst`, `hero-developer-option`, `hero-use-heros-default-key`, `ins_theme` / `theme` (Infinsight).

---

## 1. Heros Chat — `home.html` (`/`)

### 1.1 Head
- Title **"Heros"**, favicon logo, `<meta name="csrf-token">`, theme bootstrap from `localStorage['hero-theme']` (default `dark`).

### 1.2 Auth screen (`#authScreen`) — full-screen overlay
- Close/skip button (`hideAuthScreen()`, title "Skip for now").
- Logo "Heros".
- Tabs: **Sign In** (`#tabLogin`) / **Create Account** (`#tabSignup`) → `switchAuthTab('login'|'signup')`.
- **Sign-in form** `#loginForm`: Email `#loginEmail` ("you@example.com"), Password `#loginPassword`; button "Sign In →" (`handleLogin()`); divider "or continue with"; "Continue with Google" (`handleGoogleAuth('signin')`).
- **Sign-up form** `#signupForm`: Full Name `#signupName`, Email `#signupEmail`, Password `#signupPassword` ("Create a strong password"); "Create Account →" (`handleSignup()`); Google (`handleGoogleAuth('signup')`).
- **Google setup form** `#googleSetupForm` (shown when URL has `?action=google_setup`): "Complete your account setup. We have your email, just need a username and password." Username `#googleSetupName`, Password `#googleSetupPassword`, "Complete Setup →" (`handleGoogleSetup()`).
- Footer: "By continuing you agree to our Terms of Service and Privacy Policy."
- URL `?error=...` → toast + open auth on signup tab.

### 1.3 Header
- Hamburger `toggleSidebar()`; logo "Heros" → `{% url 'landing' %}`.
- Right: theme toggle (`toggleThemeSimple()`), **Temporary chat** `#tempChatBtn` (`toggleTempChat()`), **Developer Tools** `#devSidebarToggleBtn` (`toggleDevSidebar()`, only visible in Developer mode).

### 1.4 Sidebar `#sidebar` (+ `#sidebarBackdrop` on mobile)
- "New conversation" (`newChat()`).
- History list `#historyList` (default item "Welcome chat"); rendered by `renderChatHistory()` grouped by **Today / Yesterday / date**, each item: icon by task type (code / search / mic / message), preview text, delete button (`deleteChatHistory(event, chatId)`), click → `loadChatMessages(sessionId)`.
- Link **"Infinsight · Data Analyst"** → `/infinsight/`.
- User panel: logged-out row `#userInfoRowLoggedOut` ("Sign in" → `showAuthScreen()`); logged-in row `#userInfoRowLoggedIn` (avatar initials `#userAvatarInitials`, `#sidebarUserName`, `#sidebarUserEmail`, chevron `#userChevron`) → `toggleUserMenu()`.
- User dropdown `#userDropdown`: **Settings** (`openSettings()`), **Platform** (`/platform/`), **Log out** (`handleLogout()`).

### 1.5 Chat area
- Temp banner `#tempBanner`: "Temporary chat — this conversation won't be saved".
- Welcome screen `#welcomeScreen`: logo image, "Powered by", animated SVG loader (Heros wordmark), suggestion chips:
  - **Code** → `setModeCodingAndPrompt()` (enables code mode, pre-fills "Generate code: ")
  - **Summarize** → "Summarize this text:"
  - **Explain** → "Explain this concept:"
  - **Write** → "Write a blog:"
- Messages container `#messages` (scroll container).
- Scroll-to-bottom button `#scrollDownBtn` (appears when > 150 px from bottom).
- Attachment preview row `#attachPreviewRow` (chips with remove ×, max 5 files).

### 1.6 Composer (`.input-box`)
- Row 1: attach (paperclip) `#plusBtn` → `triggerAttach()` (hidden `#fileInput`, accepts `.pdf,.doc,.docx,.txt`, multiple); `#chatInputWrap` with mode badge `#modeBadge`/`#modeBadgeText` (`clearMode()`), textarea `#chatInput` ("Message Heros…", Enter=send, Shift+Enter=newline, auto-resize to 200 px); inline voice UI `#inlineVoiceUI` + `#inlineVoiceTranscriptWrap`, `#inlineVoiceCanvasWrap`; **Fast mode** `#fastModeBtn` (bolt; needs Groq key; hidden for Halo/ZORVIN/Developer); **Mute** `#muteBtn` (AI voice muted by default ⇄ unmuted); **Send/Mic/Stop** `#sendMicBtn` + `#sendMicIcon` (mic when empty → dictation; send when text/files; pause/stop while generating → aborts via `/api/chat/abort`).
- Row 2: **Search** toggle `#searchToggleBtn` (on by default), **Code** toggle `#codeToggleBtn`, **Talk** pill `#talkTooltipContainer` (tooltip "Say Hello to" / "Say Bye to", text "Talk" / "Close", model label `#voiceModelName` "Halo 3.6") → `toggleInlineVoiceChat()` (moves the voice canvas + transcript into the composer and starts/stops the voice session), **Wait** `#mainWaitBtn` ("Stop AI & Listen (Spacebar)").
- Model select `#modelSelect`: **Baymax 4.5** (`Baymax`), **Halo 3.6** (`Halo`, default), **ZORVIN** (`ZORVIN` → confirm "Download Hero's AI for ZORVIN Offline" → "Currently in development status"); **Developer Mode** option injected when the *developer option* setting is on and user is logged in. Logged-out users: only Halo/Baymax enabled. On login the default flips Halo → Baymax.
- Hint: "Heros can make mistakes. Verify important information."

### 1.7 Message rendering (`renderMessage`)
- Row: avatar (user initials / Heros logo), sender name (first name / "You" / "Heros" / "Developer AI"), copy button, attached files (image preview or file badge), bubble with formatted content.
- Developer footer (Model, Status Code, Time Taken, Error).
- **Source** button when `web_evidence` present → "Web Search Evidence" modal (title, Visit Source, URL, content per result).
- "Login Required" replies get "Go to Home" / "Go to Localhost" buttons.
- Markdown formatter: strips web-search boilerplate, linkifies URLs, code blocks with language bar + copy, inline code, tables, LaTeX (`$$…$$`, `$…$` via KaTeX), headings h1–h6, bold/italic, ul/ol, hr.
- highlight.js when "Code syntax highlighting" is on.
- Typing indicator with rotating task words per mode (Processing query → Identifying task → Searching the web / Generating code / Reading attachments / … → Finalizing response).
- System notes ("— Switched to Baymax —").
- Task-type routing: `text`, `websearch`, `coding`, `file_handle`, `search_code`, `search_file`, `code_file`, `search_code_file`, `voice_message`, `developer`, voice variants.

### 1.8 Voice conversation (`#voiceOverlay`)
- Title "Speak with Heros", sub "Tap Speak, say something, and hear the AI respond."
- Canvas orb `#voiceCanvas` (audio-reactive ring, uses `--accent`/`--accent2` hex colors).
- Buttons: **Speak/Stop** `#speakBtn`, **Wait** `#waitVoiceBtn`, **Pause** `#pauseVoiceBtn`, **Close**.
- Transcript `#voiceTranscript` ("Your speech will appear here…"), status `#voiceStatus` (Listening… / Thinking… / Speaking… (Press Space to interrupt)).
- Behaviour: 3 s silence → send; mic off while AI speaks; Spacebar interrupts; sentence-chunked Edge-TTS via `/api/tts` with word highlighting (`.tts-highlight`); interruption truncates the stored AI reply.

### 1.9 Developer mode
- Modal `#developerModal` "Developer Mode Setup": API Provider `#devProviderSelect` (OpenRouter / Groq / Gemini), Model `#devModelSelect`, custom model input `#devCustomModelInput`, "Start Session".
- Side panel `#developerSidebar` "Developer Tools": `#sideDevProviderSelect`, `#sideDevModelSelect`, `#sideDevCustomModelInput`, "Apply Changes".
- Model lists — OpenRouter: nemotron-3-super-120b-a12b:free, llama-3.2-3b-instruct:free, gemma-2-9b-it:free, nemotron-3-ultra-550b-a55b:free, nemotron-3.5-lightning:free, custom. Groq: allam-2-7b, openai/gpt-oss-20b, qwen/qwen3.8-27b, openai/gpt-oss-120b, custom. Gemini: gemini-3.6-flash, 3.5-flash, 3.5-flash-lite, 3.1-flash-lite, 2.5-flash, 2.5-flash-lite, flash-latest, custom.

### 1.10 Settings modal (`#personalizationModal`)
Nav (`switchSettingsNav(name)`): **Settings** → General, Personalization, Custom Instructions, Developer; **More** → Account, API Keys, Apps & Tools, Privacy, Terms & Policies, About Heros, Help & Support.

- **General**: Appearance (Dark / Light theme buttons `#theme-dark-btn`/`#theme-light-btn`); Display toggles — Auto-read AI responses aloud (`autoReadResponses`), Compact message layout (`compactLayout`), Code syntax highlighting (`syntaxHighlighting`, on); Chat toggles — Remember conversation history (`rememberHistory`), Enable developer model option (`developerOption`).
- **Personalization**: Your Name `#aboutName` ("What should Heros call you?"), What do you do? `#aboutRole`, Interests & Goals `#aboutInterests` (hint "Heros uses this to give you more relevant responses."), Save (`savePersonalization()`).
- **Custom Instructions**: toggle "Use custom instructions in conversations" (`enableCustomInstructions`, on); "What should Heros know about you?" `#instructionContext`; "How should Heros respond?" `#instructionBehavior`; Save.
- **Developer** ("Developer Platform"): text "Build intelligent applications, agents, and backend workflows with Heros high-speed fallback inference engine and developer tools."; card "OpenAI SDK Compatible · v1/chat/completions" — "Drop Heros base URL and secret API key straight into any official OpenAI Python or Node.js library without rewriting code." `POST https://hero-s-ai.alwaysdata.net/api/v1/chat/completions`; card "Models & Multimodal Endpoints": Baymax 4.5 (high-speed reasoning with real-time web search grounding), Halo 2.0 / 3.6 (multimodal deep analytical thinking & code generation), Speech Audio APIs (`/api/transcribe`, `/api/tts`), Project Sandboxing; buttons "Open Developer Platform", "Browse Developer Documentation" (`/platform/?tab=docs_heros`).
- **Account** ("Account Info"): username, email, User ID (`session.user_id` / "Guest"), Status "Active", Subscription "Heros 5 Free"; "Log Out".
- **API Keys**: promo card "Heros Platform API Key · sk-hero-..." + "Get Heros API Key" (`/platform/?tab=apikeys`) — "Generate secret API keys from the developer console to access Heros AI endpoints, track usage tokens, and manage dedicated project workspaces."; Gemini `#geminiApiKey` (Required, Google AI Studio link), OpenRouter `#openrouterApiKey` (Required, OpenRouter Dashboard), Groq `#groqApiKey` (Optional, Groq Console), Hugging Face `#huggingfaceApiKey` (Optional, for Halo, HF Settings); info box "Your API keys are stored securely — All keys are encrypted and stored on the server — never exposed to the browser."; "Save API Keys" (`saveApiKeys()`). Placeholders switch to "Modify your … key" when set.
- **Apps & Tools** ("Explore the full Heros ecosystem."): Zeno Pro 3.5 (Chrome extension, Download → GitHub release `Zeno_Pro_3.5.zip`), Zuno 2.1 (voice music assistant, Launch → `/zuno/`), Infinsight AI Analyst (Launch → `/infinsight/`), Platform (Open → `/platform/`), Discover Heros (Explore → `/landing/`).
- **Privacy & Security**: Data Collection & Usage (no training on conversations), API Key Encryption (AES-256 before storage, never exposed to browser), Ephemeral Sessions (Zeno temporary chats in-memory).
- **Terms & Policies**: intro; Terms of Service, Privacy & Zero Training, Data Governance & Controls; buttons "Read Full Terms & Privacy Policy" (`/terms`), "View Platform Legal & Acceptable Use" (`/platform/?tab=terms`).
- **About Heros**: logo, "Heros", badge "Heros 5th Gen", description ("…Powered by Baymax 4.5 and Halo 3.6."), "What's New in Heros 5th Gen": Fast Mode Routing; Zeno Pro 3.5 & Zuno 2.1; Deep Web Search (DuckDuckGo, Wikipedia, Serply, Serpstack); buttons Discover Heros / Heros Docs; "Built by · hudsonmathew2004@gmail.com".
- **Help & Support**: help items — Start a conversation; Attach files; Input Controls; Voice input; Switch AI model; Zeno Chrome Extension (Eco / Plus modes); AI Analyst (Infinsight); Contact support (huddy1910@gmail.com); "Send Support Message" form — Category `#home-help-category` (General Support Inquiry, Bug Report, Quota Increase Request, API Key & Authentication, Billing & Enterprise Tier), Subject `#home-help-subject`, Message `#home-help-message`, submit `#home-help-submit-btn` (`sendHomeSupportMessage()` → `/api/platform/help/send`).

### 1.11 Legacy duplicate modals (unreachable in v5, content identical to Settings panels)
`#apiKeysModal` (API keys), `#aboutHerosModal` (About; footer "Built with ❤️ by the Heros team · huddy1910@gmail.com"), `#helpModal` (Help items). These were never opened by any code path (all openers route into the Settings modal) and duplicated element IDs; the redesign folds them into Settings.

### 1.12 Notifications & dialogs
- Toast `.custom-notification` (info / success / error / warning, 3 s).
- Confirm dialog `.custom-confirm-overlay` (icon, message, Cancel / Confirm).
- First-login prompt: "API keys are required to use Hero's AI. Would you like to configure them now?" (Configure Keys / Later).

### 1.13 API endpoints used by Heros Chat
`GET /api/auth/check-session`, `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/logout`, `GET /auth/google?flow=`, `POST /api/auth/google/complete-signup`, `GET /api/keys/check`, `POST /api/keys/save`, `GET /api/user/profile`, `POST /api/user/settings/save`, `POST /api/chat`, `POST /api/chat/abort`, `POST /api/tts`, `GET /api/chat/history`, `GET /api/chat/history/<id>`, `POST /api/chat/history/<id>/delete`, `POST /api/platform/help/send`.

---

## 2. Heros main page — `landing.html` (`/landing/`)

- **Meta**: title "Heros — AI that refuses to go offline"; description "Heros is a production-grade AI assistant platform with a 3-tier fallback engine (Gemini → OpenRouter → Groq), Infinsight RAG data analytics, voice, web search, and file analysis."
- **Nav**: brand; links Features, Documents, Products, Company, GitHub; actions **API Keys** (`#openKeysBtn`), **Platform**, logged-in: **Logout** (`handleLogout()`) + **Open Chat**; logged-out: **Login** (`.open-login`); mobile toggle.
- **Hero**: badge "New: Gemini 3.6 & Zeno Media Switcher →" (#updates); eyebrow "INTENT-AWARE NLP ROUTING"; H1 "The Unbroken AI Experience"; lede "Heros automatically coordinates multiple specialized engines to keep your productivity running at 100% uptime. Explore our systems below."; CTA Get Started (login) / Open Chat; "View on GitHub".
- **Stats** (count-up): 3 Failover Tiers · 100% Uptime Target · 45ms Triage Latency · 24/7 Active Monitoring.
- **Features** "Core pillars — Four systems, one assistant." ("Everything Heros does is built around one idea: never leave the user staring at an error."):
  1. Multi-Model Fallback Engine — Intent-aware routing · Zero-downtime handoff · Per-user API keys
  2. Infinsight RAG Analytics — pgvector semantic search · Pandas execution layer · Chart-ready answers
  3. Web, Voice & Media Analysis — Serpstack & Serply Web Search · Zeno & Zuno Media Switcher · OCR & document parsing
  4. Unbroken Chat Context — Persistent session history · Live Pause & Abort Controls · NLP-based intent detection
- **Failover order** "How it fails gracefully." — Tier 1 Gemini (primary brain), Tier 2 OpenRouter (pool of six backup models), Tier 3 Groq (ultra-low-latency final safety net).
- **Products** "Tech Stack & Ecosystem — The engines behind Heros.": AI Models (Gemini 3.6-flash & 3.5-lite; OpenRouter Nemotron, Llama 3.2, Gemma 2; Groq), Data & Vector Storage (PostgreSQL, pgvector, RAG Analytics), Zeno Extension (live text selection, voice overlay, Zuno controller, syncs with session), Backend Framework (Django 5.2, Fernet, Docker).
- **Product tabs** (sticky, glider): Baymax · Halo · Infinsight · Zeno · Zuno (scroll-spy).
  - **Baymax** — "3-TIER FALLBACK ENGINE — LIVE", "Meet Baymax", meta Encrypted keys / pgvector RAG / Django 5.2, "Try Baymax" (`/?model=Baymax`); **routing card** (Gemini/OpenRouter/Groq nodes cycling every 4.2 s) + **Outage Simulation Sandbox** console with buttons Simulate Gemini Outage / Simulate OpenRouter Outage / Reset Connection (scripted logs).
  - **Halo** — "GATEWAY COORDINATOR", "Meet Halo", Intelligent routing / Instant coordination / Automatic triage, "Try Halo" (`/?model=Halo`); diagram: User Request → Halo Coordinator (Intent Routing & Fast Triage) → Casual/Fast Query → Execute Instantly | Heavy Reasoning → Route to Baymax.
  - **Infinsight** — "Your data, in a conversation", "Explore Infinsight", 3 steps (upload CSV/Excel/PDF; rows embedded in pgvector; ask in plain English), "Open Infinsight"; mock window "infinsight — sales_q2.xlsx · 4,208 rows indexed", Q "Which region underperformed in June?" A "The South region underperformed by 18% in June, driven mostly by a drop in repeat orders."
  - **Zeno** — "Heros, anywhere on the web", "Meet Zeno", Ask Zeno Plus (right-click), Voice Chat, Temporary Chats; "Download for Edge & Chrome" (`Zeno_Pro_3.0.zip`); mock extension popup (Eco/Plus, "Hello! I'm Zeno, your mini AI assistant.", "Can you break down the python event loop?").
  - **Zuno** — "Zuno inside Zeno", "Meet Zuno", Silent background control / Voice commands ("Play [Song]", "Pause", "Next", "Skip Ad") / Music Radar; Download; mock player "I'm Scared — Anirudh Ravichander", 1:12 / -2:24 (`leo.png`).
- **Intelligence** "Advanced NLP Pipeline — Adaptive Personas & Fast Mode": Adaptive Personas (Chat ChatGPT-style, Coding Claude-style, Search Gemini/Grok-style, Voice ChatGPT-Voice-style); Groq Fast Mode & Budgeting (Instant Replies, Response Budgeting, Resource Efficiency, Halo Integration).
- **Documents** "Architecture — Heros Platform Documentation": Overview & Platform Vision (2 paragraphs); What Heros Does (Smart AI Chat, Document Analysis, Web Research, Voice & Audio, Secure Keys & OAuth, Infinsight RAG); Core System Components (Baymax router, Halo orchestrator, Zeno extension, Zuno voice & music, Infinsight RAG); Execution Pipeline (1 Request Ingestion, 2 NLP Intent & Router Classification, 3 Multi-Provider Dispatch, 4 Response Processing & Isolation).
- **Developers** "Open Source — Build custom agents with our open-source routing engine…".
- **Company** "About Us — The Heros Company" (2 paragraphs).
- **FAQ** (accordion): How does the 3-Tier Fallback engine work? · Are my API keys stored securely? · Is Heros fully free and open-source? (MIT) · What is the difference between Zeno and Zuno?
- **CTA band**: "Bring your own keys. Never worry about downtime again." / "Free, open source, and self-hostable. Connect Gemini, OpenRouter, and Groq in under a minute." — Get Started / Open Chat, "Add your API keys" (`#ctaKeys`).
- **Changelog** "What's New in Heros": Live Pause & Abort Feature; Upgraded Model Fallbacks; Zeno Media Switcher; Serpstack & Serply Web Engines.
- **Footer**: brand + "The resilient, multi-tier AI routing gateway built for guaranteed uptime and privacy." + "All Systems Operational"; Platform (Features, Pipeline, Ecosystem); Resources (Documentation, Terms & Policies, Security Architecture & Privacy, Help & Support → `/platform/?tab=help` or mailto, GitHub Repository); Ecosystem (Zeno Extension, Zuno Audio → `Zeno_3.5_Pro.zip`, Infinsight RAG); "© 2026 Heros AI platform. Licensed under MIT."; GitHub + X icons.
- **Modals**: *API Key Management* `#keysOverlay` (Heros Platform API Key promo; Gemini `#geminiKey` tier 1, OpenRouter `#openrouterKey` tier 2, Groq `#groqKey` tier 3, Hugging Face `#huggingfaceKey` optional; eye toggles; trust signal "Encrypted at rest with Fernet…"; Cancel / Save keys — Gemini required); *Login* `#loginOverlay` (Email `#landingLoginEmail`, Password `#landingLoginPassword`, Google, Cancel / Login → redirect `/`); *How it fails gracefully* `#gracefulOverlay` (opener `#gracefulBtn` was missing in v5 — now wired); save toast `#saveToast`.
- Scroll-reveal animations; Escape closes modals.

---

## 3. Infinsight — `infinsight.html` (`/infinsight/`)

- Title "Infinsight | AI Data Analyst".
- **Sidebar**: brand "Infinsight · Heros Powered"; **Gemini API Key** section `#sidebarApikeySection` (status dot `#apikeyStatusDot`, input `#sidebarGeminiKey` "AIza…", Save `#sidebarApikeySaveBtn` → `saveGeminiKey()`, Enter saves); no-key banner `#nokeyBanner` ("Gemini API key not configured. Add your key"); **New Analysis** (`handleUploadClick()`); "Your Datasets" `#sessionsList` (empty state `#sessionsEmpty` "No datasets yet. Upload a file to start analyzing."; items with file-type icon csv/excel/pdf, name, "N msgs · date", status dot, delete); "Chat with Heros" link.
- **Topbar**: menu toggle, title `#currentSessionTitle` ("Infinsight") + badge `#currentSessionBadge` ("AI Analyst" / CSV / EXCEL / PDF), theme toggle, `#authArea` (Sign In button or user chip with dropdown: name, email, Sign Out).
- **Processing banner** `#processingBanner`: "Indexing your file, Please wait — this takes 30–60 seconds…" (polls status every 4 s).
- **Welcome** `#insWelcome`: "Welcome{ back username}", "Upload a dataset to start an AI-powered data analysis session.", drop zone `#welcomeDropZone` ("Click to upload or drag and drop", "CSV, Excel, or PDF (max. 20MB)"), capability cards: Explore data / Summarize / Ask questions.
- **Chat** `#insChatArea`: messages `#insMessages` (user/AI rows, copy, markdown, tables, code blocks, **auto charts** from ```chart / ```json chart blocks via Chart.js), streaming SSE status line (`#insStatusText`), input `#insInput` "Ask anything about your data…", send `#insSendBtn`, Heros home button; hint "Infinsight answers from your file's data only — powered by Heros + Pinecone RAG".
- **Auth modal** `#authModal`: tabs `#tabSignin`/`#tabSignup`, Google, `#signinEmail`, `#signinPassword` (eye toggle), errors, Sign In `#signinBtn`; `#signupName`, `#signupEmail`, `#signupPassword` ("Min 6 chars, 1 uppercase, 1 number"), Create Account `#signupBtn`; cross links.
- **Upload modal** `#insUploadModal`: "Upload Dataset", description, security info box, drop area `#insFileDrop`, input `#insFileInput` (.csv,.xlsx,.xls,.pdf), selected file `#selectedFileDisplay` (`#selectedFileName`, `#selectedFileSize`, remove), progress `#uploadProgress`/`#uploadProgressBar`, Cancel / **Start Analysis** `#uploadSubmitBtn`.
- Toast `#insNotif`.
- **API**: `/api/auth/check-session`, `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`, `/auth/google?flow=signin&next=`, `/api/keys/check`, `/api/keys/save`, `/infinsight/sessions/`, `/infinsight/session/<id>/`, `/infinsight/session/<id>/status/`, `/infinsight/session/<id>/delete/`, `/infinsight/upload/`, `/infinsight/chat/` (SSE stream: `status` / `final` events).

---

## 4. Zuno — `zuno/zuno.html` (`/zuno/`)

- Title "Zuno AI Music Assistant"; header brand "Heros" → `/`.
- H1 "Zuno", subtitle "Your intelligent voice-controlled music assistant".
- Platform switch: **YT Music** (`yt_music`, default) / **YouTube** (`youtube`).
- Mic button `#micBtn` inside `#micContainer` (ripple, `.listening`), disabled + dimmed when `groq_missing`; status `#statusText` ("Tap to speak" / "Listening..." / "Processing..." / "Done!" / "Failed." / "Configure your API key to start"); transcription `#transcriptionText`.
- Rules card: Play Music ("Play Starboy by The Weeknd"), Search Artist ("Search for Anirudh"), Control Playback ("Next song", "Pause", "Resume"), Music Radar ("Bring music tab to front").
- Music player `#zuno-music-player`: album art, track title/artist, volume bars, current/remaining time, progress, buttons Previous, Skip Back 10s, Play/Pause (`.icon-play`/`.icon-pause`), Skip Forward 10s, Next, Radar (open YouTube tab; hidden without extension).
- Search results `#resultsContainer` / `#resultsTitle` / `#songList`.
- Error card `#errorCard` ("Groq API Key Missing" steps / "Login Required" / generic).
- Toast `#toast`.
- Logic: Web Speech API → `POST /zuno/process_audio/` `{text, platform}`; `play_extension` → Zeno extension `chrome.runtime.sendMessage("egobkkfkdjagkggbpfkadhfknjeofjab", {action:"play_music"})` (fallback: navigate to URL), status polling `get_music_status` every 1 s, `control_music` commands.

---

## 5. Heros Platform — `platform.html` (`/platform/`)

### 5.1 Shell
- **Sidebar**: header "Heros Platform" (→ `/landing/`); project selector (`#active-project-name`, popover `#projectPopover` with `#project-list-items` + "Create Project"); search "Search Platform... Ctrl K" (`openPlatformSearch()`); menu: Home, Playground, Models, API Keys, Projects, Usage · *Account & Billing*: Account & Profile, Billing & Limits, Settings · *Documentation*: Heros Docs, Developer Docs, Data Controls, Security & Privacy · *Support*: Help, Status, Terms & Policies; footer user pill (avatar, name, "Personal Org") with popover `#userPopover` (Discover Heros, Logout → `/api/auth/logout`).
- **Header**: logo + `#page-title`; Docs icon (→ docs_dev), "Discover Heros", "Get API key", "Open Chat".
- `?tab=<id>` deep-links any section.
- **Command palette** `#platform-search-overlay` (Ctrl/⌘ K): 16 navigation entries + 6 quick actions (Create Secret API Key, Create New Project, Send Support Message, Purge API Request Logs, Open Chat in Home, Visit Discover Page); ↑ ↓ ↵ esc.

### 5.2 Sections (`.content-section`)
- **Home** — "Good evening, {name}" + "Build, monitor, and scale production AI applications with Heros fallback routing engine."; metric cards: Organization credits $0.00 (Add funds / View billing), Spend this month `#home-spend-val` ("of $500 tier limit · resets Nov 1"), System status `#home-system-status` (Latency `#home-avg-latency`, Uptime 99.98%); Token volume ("No activity in the last 7 days", Try a prompt); Models showcase: Baymax 4.5 (Fastest, Intelligent Router), Halo 2.0 (Complex projects, Agents), Zeno (Browser Extension, Everyday tasks), Infinsight *New* (Data Analytics, Vector RAG); Announcements (October 2026): Model Comparison Mode is Live!, Baymax 4.5 Released (128k context), Scoped Secret Keys & Auto-Expiration.
- **Playground (chat)** — header "New prompt · Draft · Unsaved changes", buttons Compare `#btn-compare-mode`, `<> Code` (code export), Clear; left panel **Prompt** (Generate prompt, Templates, system prompt `#pg-system-prompt`, "Add messages to prompt"), **Model** (Provider `#dev-provider`: Baymax-4.5 / Infinsight / Halo / Zeno / Gemini / Groq / OpenRouter; Model Variant `#dev-model-select`; Custom Model ID `#dev-model-input`; Task/Mode `#dev-task-mode`; Execution Speed `#dev-fast-mode`; Temperature `#dev-temperature` 0–2; Max Tokens `#dev-max-tokens` 64–8192; Temporary Chat "Active"); chat column A `#chat-box` (+ header `#pg-col-header-1`, `#compare-model-a-label`), column B `#pg-chat-col-2` with `#dev-provider-2` and `#chat-box-2`; composer `#chat-input`, attach `#pg-file-input` / `#pg-file-tag`, send `#pg-send-btn`.
- **Models** — "Heros AI Engine & Models Catalog": baymax-4.5 (Active Production Router; 128,000 tokens; Text, Vision, Web Search; Developer Tier Free Trial; Test in Playground); Ecosystem engines halo / zeno / zuno / infinsight ("Not Available").
- **API Keys** — table `#keys-table` (Name, Project, Scope, Environment, Secret Key, Created, Expires, Last Used, Spend, Status, Action: Pause/Enable, Revoke); Group by API Key / Project; Filter `#project-filter`; New Project; "API quickstart"; "Create API key" (modal: name, project, environment live/test/staging, scope full/read, expiry never/30/60/90; prerequisite check for Gemini + OpenRouter provider keys; success screen with one-time key + Copy); "Can't find your API keys here?" note; **External Provider Keys**: Gemini `#ext-gemini`, Groq `#ext-groq`, OpenRouter `#ext-or`, Hugging Face `#ext-hf` — each with status badge, show/hide, **Test Connection** + result line; "Save Provider Keys".
- **Projects** — Create project; search `#projects-search-input`; table (Project + client id, Keys, Created, Monthly Spend, Billing Tier "Set up billing", actions: copy client ID, billing, usage, keys, delete).
- **Usage** — "API Usage & Metrics Dashboard", last updated + Refresh; cards Requests Today, Tokens Used Today (prompt/completion), Successful, Errors, Estimated Cost Today, Avg Latency; Cost & Token Breakdown by Model (filter); Current Tier & Rate Limits (RPM, TPM, 4-Hour, Daily with reset labels; Request Quota Increase modal: tier select + use case); charts Total API Requests (per key filter, success-rate dots), Total API Errors (per code), Token Usage (30 days, prompt vs completion); Usage based on projects table; Recent API Requests; Activity Log.
- **Account & Profile** — tabs Developer Profile (avatar initials, name, email • Heros 5 Free, Change Avatar; Full Name, Email (read-only), Organization, Primary Role select; Save) / Team & Organization (Invite Member; members table with you as Owner).
- **Billing & Limits** — Current plan "Developer Tier (Free Trial)", Upgrade to Pro; Monthly Spend Limit, Email Warning Threshold, Billing Contact Email; Save.
- **Settings** — tabs Notifications & Preferences (Daily API Usage Summary, Rate Limit & Quota Threshold Alerts, Product Announcements & Model Releases), Security & Password (current/new/confirm, Update Password; 2FA), Danger Zone (Purge Logs, Delete Account).
- **Heros Docs** — overview, What Heros Does (6), Core System Components (5), Execution Pipeline (4), Tech stack & support links (email, web, GitHub); GitHub Repository / Live Portal.
- **Developer Docs** — Auth & Base URL (`Authorization: Bearer sk-hero-YOUR_API_KEY`, `https://hero-s-ai.alwaysdata.net/api/v1`); model routing strings (baymax-4.5 production; halo, zeno, zuno, infinsight not available); endpoint boxes with Python/JS/cURL switch + copy: Text Chat Completion, Web Search Grounding, Audio Transcription (`/api/transcribe`), TTS (`/api/tts`), Usage telemetry (`GET /api/v1/usage`); API parameter table.
- **Data Controls** — Zero Model Training Commitment; Purge API Request Logs; Developer Account & Data Purge; Data Retention Schedule table.
- **Security & Privacy** — Fernet encryption at rest, SHA-256 key hashing, TLS 1.3, OAuth 2.0 & PKCE; full terms links.
- **Help** — Documentation, Community (GitHub), System Status (99.98%), Direct Support (<24h, huddy1910@gmail.com); FAQ ×4; Send Support Message (category, subject, message).
- **Status** — All Systems Operational, 99.98% 90-day uptime; services: Developer API Gateway, Baymax Router, Gemini route, Groq route, OpenRouter route; incident history (none in 90 days).
- **Terms & Policies** — tabs Terms of Service, Privacy Policy, Cookie Policy, Acceptable Use (Last Updated: October 8, 2026).

### 5.3 Modals
Generic `#key-modal-overlay`/`#key-modal-content` (create key, create project, quota), code export `#code-modal-overlay` (python / javascript / cURL with line numbers + copy), templates `#templates-modal-overlay` (Software Architect & Mentor, Live Web Researcher, JSON Data Formatter, Concise Voice Responder), custom alert / prompt / confirm (override `window.alert` / `window.confirm`).

### 5.4 API
`/api/platform/keys/{generate,list,toggle/<h>,delete/<h>,external,external/get,test}`, `/api/platform/usage`, `/api/platform/help/send`, `/api/platform/quota/increase`, `/api/platform/projects/{create,list,delete/<id>}`, `/api/user/settings`, `/api/user/password/change`, `/api/user/danger/{purge-logs,delete-account}`, `/api/chat`.

---

## 6. Terms & Privacy — `terms_and_privacy.html`
Header "Heros AI — Terms & Policies" / "Legal agreements, privacy practices, and acceptable use guidelines."; tabs Terms of Service (1 Acceptance, 2 Service Description incl. Baymax, 3 User Responsibilities, 4 API Keys & Third-Party Services, 5 Limitation of Liability, 6 Contact), Privacy Policy (1 Information We Collect, 2 Data Storage & Security, 3 AI Processing, 4 Contact), Cookie Policy (Authentication, Session, Preference, Security cookies), Acceptable Use (5 prohibitions; suspension); footer "© 2026 Heros AI. All rights reserved. | Go to Developer Dashboard →".

## 7. 404 — `404.html`
"404", "Page not found", "The page you are looking for doesn't exist or has been moved. Let's get you back to safety.", "Return Home" → `/`.

## 8. Admin (staff) — `templates/admin/index.html`
Jazzmin dashboard "Heros AI Executive Command Center / Platform Headquarters": KPI cards (Total Developers, Tokens Processed, API Requests, Avg Execution Latency), email broadcast subscribers, recent broadcasts, etc. Internal tool — **not part of the user-facing redesign**, preserved unchanged.
