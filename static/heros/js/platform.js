/* ══════════════════════════════════════════════════════════════
   Heros Platform — platform.js (v6; moved out of the v5 template)
   Command palette, custom dialogs, SPA tabs, API keys, projects, usage
   charts, playground (+ compare / code export), docs, settings.
   Endpoints and behaviour are unchanged from v5.
   ══════════════════════════════════════════════════════════════ */
        // Platform Command Palette / Search Logic
        const platformSearchItems = [
            // Navigation
            { type: 'nav', title: 'Home Overview', desc: 'Gateway telemetry, organization credits, spend metrics & models', icon: 'fa-house', tab: 'home', keywords: 'dashboard metrics telemetry start spend' },
            { type: 'nav', title: 'Playground', desc: 'Interactive chat sandbox with parameters, system instructions & live reasoning', icon: 'fa-terminal', tab: 'chat', keywords: 'prompt reasoning playground test ai converse chat' },
            { type: 'nav', title: 'Models Catalog', desc: 'Compare Baymax 4.5, Halo 2.0, Zeno & Infinsight performance specs', icon: 'fa-cubes', tab: 'models', keywords: 'baymax halo zeno infinsight compare specs' },
            { type: 'nav', title: 'API Keys', desc: 'Create secret keys, set expiration dates, configure custom provider keys', icon: 'fa-key', tab: 'apikeys', keywords: 'credentials sk-hero token generate secret gemini openrouter groq' },
            { type: 'nav', title: 'Projects', desc: 'Isolated project workspaces, scoped keys & environment sandboxing', icon: 'fa-folder-tree', tab: 'projects', keywords: 'workspace staging production manage organize' },
            { type: 'nav', title: 'Usage & Quotas', desc: 'Token usage breakdown, project costs, latency analytics & model telemetry', icon: 'fa-chart-simple', tab: 'usage', keywords: 'tokens spend cost charts analytics consumption limit' },
            { type: 'nav', title: 'Account & Profile', desc: 'User credentials, organizations, subscription tiers & security', icon: 'fa-user', tab: 'account', keywords: 'email profile name password org tier subscription' },
            { type: 'nav', title: 'Billing & Limits', desc: 'Credit balance, spend alerts, auto-reload & invoices', icon: 'fa-credit-card', tab: 'billing', keywords: 'payment funds credit card budget funds invoice' },
            { type: 'nav', title: 'Settings', desc: 'Security credentials, notifications, billing limits & theme preferences', icon: 'fa-gear', tab: 'settings', keywords: 'preferences dark mode notifications alerts configure' },
            { type: 'nav', title: 'Heros Docs', desc: 'SDK quickstarts, architecture guides, routing engine & voice endpoints', icon: 'fa-book', tab: 'docs_heros', keywords: 'documentation guide manual quickstart sdk tutorial' },
            { type: 'nav', title: 'Developer Docs', desc: 'OpenAI SDK drop-in code samples, cURL requests, Whisper & TTS endpoints', icon: 'fa-code', tab: 'docs_dev', keywords: 'openai completions api requests python curl javascript transcribe tts' },
            { type: 'nav', title: 'Data Controls & Governance', desc: 'Zero model training commitment, log purges & data deletion policies', icon: 'fa-sliders', tab: 'data_controls', keywords: 'privacy purge zero training retention compliance wipe' },
            { type: 'nav', title: 'Security & Privacy', desc: 'Fernet AES-256 encryption, ephemeral sessions & isolated tenants', icon: 'fa-shield-halved', tab: 'security_privacy', keywords: 'security fernet encryption safe audit oauth' },
            { type: 'nav', title: 'Help & Support', desc: 'Frequently asked questions, guides & direct engineer support form', icon: 'fa-circle-question', tab: 'help', keywords: 'faq inquiry support contact question ticket email' },
            { type: 'nav', title: 'System Status', desc: 'Live gateway uptime, regional latency pings & health monitoring', icon: 'fa-signal', tab: 'status', keywords: 'uptime operational online outage ping latency 99%' },
            { type: 'nav', title: 'Terms & Policies', desc: 'Terms of service, privacy policy, cookie guidelines & acceptable use', icon: 'fa-file-contract', tab: 'terms', keywords: 'legal policy terms privacy aup cookies' },

            // Quick Actions
            { type: 'action', title: 'Create Secret API Key', desc: 'Generate a new sk-hero-... key with custom expiration', icon: 'fa-plus', action: 'generate_key', keywords: 'new key create generate' },
            { type: 'action', title: 'Create New Project', desc: 'Set up an isolated project environment for keys and telemetry', icon: 'fa-folder-plus', action: 'create_project', keywords: 'new project add workspace' },
            { type: 'action', title: 'Send Support Message', desc: 'Open the support inquiry form to contact engineering', icon: 'fa-envelope', action: 'send_support', keywords: 'contact support email help bug' },
            { type: 'action', title: 'Purge API Request Logs', desc: 'Instantly wipe historical request and token metrics logs', icon: 'fa-trash-can', action: 'purge_logs', keywords: 'delete wipe purge clear logs' },
            { type: 'action', title: 'Open Chat', desc: 'Switch back to the main Chat interface', icon: 'fa-bolt', action: 'open_chat', keywords: 'home chat conversation' },
            { type: 'action', title: 'Visit Discover Page', desc: 'Explore Heros showcase, models & release history', icon: 'fa-compass', action: 'open_landing', keywords: 'landing explore showcase discover' }
        ];

        let selectedCmdIndex = 0;
        let filteredCmdItems = [];

        function openPlatformSearch() {
            const overlay = document.getElementById('platform-search-overlay');
            const input = document.getElementById('cmd-palette-input');
            if (!overlay || !input) return;

            overlay.classList.add('active');
            input.value = '';
            filterPlatformSearch();
            setTimeout(() => input.focus(), 50);
        }

        function closePlatformSearch() {
            const overlay = document.getElementById('platform-search-overlay');
            if (overlay) overlay.classList.remove('active');
        }

        function filterPlatformSearch() {
            const input = document.getElementById('cmd-palette-input');
            const resultsEl = document.getElementById('cmd-palette-results');
            if (!input || !resultsEl) return;

            const q = input.value.trim().toLowerCase();

            if (!q) {
                filteredCmdItems = [...platformSearchItems];
            } else {
                filteredCmdItems = platformSearchItems.filter(item => {
                    const matchTitle = item.title.toLowerCase().includes(q);
                    const matchDesc = item.desc.toLowerCase().includes(q);
                    const matchKeywords = item.keywords.toLowerCase().includes(q);
                    return matchTitle || matchDesc || matchKeywords;
                });
            }

            selectedCmdIndex = 0;
            renderCmdResults();
        }

        function renderCmdResults() {
            const resultsEl = document.getElementById('cmd-palette-results');
            if (!resultsEl) return;

            if (filteredCmdItems.length === 0) {
                resultsEl.innerHTML = `
                    <div style="padding: 32px 16px; text-align: center; color: var(--text-faint); font-size: 0.88rem;">
                        <i class="fa-solid fa-magnifying-glass" style="font-size: 1.4rem; margin-bottom: 8px; opacity: 0.4; display: block;"></i>
                        No matching results found
                    </div>
                `;
                return;
            }

            let html = '';
            let currentGroup = '';

            filteredCmdItems.forEach((item, index) => {
                const group = item.type === 'action' ? 'Quick Actions' : 'Navigation & Pages';
                if (group !== currentGroup) {
                    currentGroup = group;
                    html += `<div class="cmd-group-label">${currentGroup}</div>`;
                }

                const isSelected = index === selectedCmdIndex ? 'selected' : '';
                const badgeText = item.type === 'action' ? 'Action' : 'Tab';

                html += `
                    <div class="cmd-item ${isSelected}" onclick="executeCmdItem(${index})" onmouseenter="selectCmdIndex(${index})">
                        <div class="cmd-item-icon"><i class="fa-solid ${item.icon}"></i></div>
                        <div class="cmd-item-content">
                            <div class="cmd-item-title">${item.title}</div>
                            <div class="cmd-item-desc">${item.desc}</div>
                        </div>
                        <span class="cmd-item-badge">${badgeText}</span>
                    </div>
                `;
            });

            resultsEl.innerHTML = html;

            const selectedEl = resultsEl.querySelector('.cmd-item.selected');
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest' });
            }
        }

        function selectCmdIndex(idx) {
            selectedCmdIndex = idx;
            const items = document.querySelectorAll('.cmd-item');
            items.forEach((el, i) => el.classList.toggle('selected', i === idx));
        }

        function handleCmdKeyDown(e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (filteredCmdItems.length > 0) {
                    selectedCmdIndex = (selectedCmdIndex + 1) % filteredCmdItems.length;
                    renderCmdResults();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (filteredCmdItems.length > 0) {
                    selectedCmdIndex = (selectedCmdIndex - 1 + filteredCmdItems.length) % filteredCmdItems.length;
                    renderCmdResults();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCmdItems.length > 0 && filteredCmdItems[selectedCmdIndex]) {
                    executeCmdItem(selectedCmdIndex);
                }
            } else if (e.key === 'Escape') {
                closePlatformSearch();
            }
        }

        function executeCmdItem(idx) {
            const item = filteredCmdItems[idx];
            if (!item) return;

            closePlatformSearch();

            if (item.type === 'nav' && item.tab) {
                switchTab(item.tab);
            } else if (item.type === 'action') {
                if (item.action === 'generate_key') {
                    switchTab('apikeys');
                    setTimeout(() => openGenerateKeyModal(), 200);
                } else if (item.action === 'create_project') {
                    switchTab('projects');
                    setTimeout(() => openCreateProjectModal(), 200);
                } else if (item.action === 'send_support') {
                    switchTab('help');
                    setTimeout(() => {
                        const target = document.getElementById('help-message');
                        if (target) target.focus();
                    }, 250);
                } else if (item.action === 'purge_logs') {
                    switchTab('data_controls');
                    setTimeout(() => purgeSettingsLogs(), 250);
                } else if (item.action === 'open_chat') {
                    window.location.href = '/';
                } else if (item.action === 'open_landing') {
                    window.location.href = '/landing/';
                }
            }
        }

        // Global Keyboard Shortcut: Ctrl + K / Cmd + K to toggle command palette
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                const overlay = document.getElementById('platform-search-overlay');
                if (overlay && overlay.classList.contains('active')) {
                    closePlatformSearch();
                } else {
                    openPlatformSearch();
                }
            } else if (e.key === 'Escape') {
                const searchOverlay = document.getElementById('platform-search-overlay');
                if (searchOverlay && searchOverlay.classList.contains('active')) {
                    closePlatformSearch();
                }
            }
        });

        // Copy Code Button Logic
        function copyCode(btn) {
            const pre = btn.closest('.code-container').querySelector('pre');
            if (pre) {
                navigator.clipboard.writeText(pre.innerText).then(() => {
                    const originalText = btn.innerText;
                    btn.innerText = 'Copied!';
                    btn.classList.add('copied');
                    setTimeout(() => {
                        btn.innerText = originalText;
                        btn.classList.remove('copied');
                    }, 2000);
                }).catch(() => {
                    btn.innerText = 'Copied!';
                    setTimeout(() => { btn.innerText = 'Copy'; }, 2000);
                });
            }
        }

        // Custom Styled Alert Box Logic
        function customAlert(message, title = null, type = 'info') {
            return new Promise((resolve) => {
                const overlay = document.getElementById('custom-alert-modal-overlay');
                const titleEl = document.getElementById('custom-alert-title');
                const msgEl = document.getElementById('custom-alert-message');
                const iconEl = document.getElementById('custom-alert-icon');
                const closeBtn = document.getElementById('custom-alert-close-btn');

                if(!overlay || !msgEl) {
                    console.log(message);
                    resolve();
                    return;
                }

                msgEl.innerHTML = message || '';

                // Determine icon, title & theme based on text / type
                const msgLower = (message || '').toLowerCase();
                let computedTitle = title;

                if (type === 'error' || msgLower.includes('failed') || msgLower.includes('error')) {
                    iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
                    iconEl.className = 'custom-alert-icon error';
                    if (!computedTitle) computedTitle = 'System Alert';
                } else if (type === 'success' || msgLower.includes('success') || msgLower.includes('saved')) {
                    iconEl.innerHTML = '<i class="fa-solid fa-check"></i>';
                    iconEl.className = 'custom-alert-icon';
                    if (!computedTitle) computedTitle = 'Success';
                } else if (msgLower.includes('select') || msgLower.includes('mode') || msgLower.includes('please')) {
                    iconEl.innerHTML = '<i class="fa-regular fa-lightbulb"></i>';
                    iconEl.className = 'custom-alert-icon warning';
                    if (!computedTitle) computedTitle = 'Notice';
                } else {
                    iconEl.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
                    iconEl.className = 'custom-alert-icon';
                    if (!computedTitle) computedTitle = 'Heros AI';
                }

                titleEl.innerText = computedTitle;

                overlay.classList.add('active');

                const handleClose = () => {
                    overlay.classList.remove('active');
                    closeBtn.removeEventListener('click', handleClose);
                    document.removeEventListener('keydown', handleKeyDown);
                    resolve();
                };

                const handleKeyDown = (e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                        handleClose();
                    }
                };

                closeBtn.addEventListener('click', handleClose);
                document.addEventListener('keydown', handleKeyDown);
                closeBtn.focus();
            });
        }

        // Custom Styled Confirm Box Logic

        function customPrompt(message, title = 'Input Required', defaultValue = '') {
            return new Promise((resolve) => {
                const overlay = document.getElementById('custom-prompt-modal-overlay');
                const titleEl = document.getElementById('custom-prompt-title');
                const msgEl = document.getElementById('custom-prompt-message');
                const inputEl = document.getElementById('custom-prompt-input');

                if (!overlay || !msgEl || !inputEl) {
                    const res = window.prompt(message, defaultValue);
                    resolve(res);
                    return;
                }

                msgEl.innerHTML = message || '';
                titleEl.innerText = title || 'Input Required';
                inputEl.value = defaultValue || '';

                overlay.classList.add('active');
                inputEl.focus();

                window._currentPromptResolve = resolve;
            });
        }

        function closeCustomPrompt(val) {
            const overlay = document.getElementById('custom-prompt-modal-overlay');
            if (overlay) overlay.classList.remove('active');
            if (window._currentPromptResolve) {
                window._currentPromptResolve(val);
                window._currentPromptResolve = null;
            }
        }

        function customConfirm(message, title = null, confirmBtnText = 'Confirm', type = 'warning') {
            return new Promise((resolve) => {
                const overlay = document.getElementById('custom-confirm-modal-overlay');
                const titleEl = document.getElementById('custom-confirm-title');
                const msgEl = document.getElementById('custom-confirm-message');
                const iconEl = document.getElementById('custom-confirm-icon');
                const okBtn = document.getElementById('custom-confirm-ok-btn');
                const cancelBtn = document.getElementById('custom-confirm-cancel-btn');

                if (!overlay || !msgEl) {
                    const res = window.nativeConfirm ? window.nativeConfirm(message) : true;
                    resolve(res);
                    return;
                }

                msgEl.innerHTML = message || '';
                titleEl.innerText = title || 'Confirm Action';
                okBtn.innerText = confirmBtnText || 'Confirm';

                if (type === 'danger' || type === 'error' || (message && (message.toLowerCase().includes('delete') || message.toLowerCase().includes('purge') || message.toLowerCase().includes('irreversible')))) {
                    iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
                    iconEl.className = 'custom-alert-icon error';
                    okBtn.style.backgroundColor = 'var(--danger)';
                    okBtn.style.color = '#fff';
                    okBtn.style.boxShadow = 'none';
                } else {
                    iconEl.innerHTML = '<i class="fa-solid fa-circle-question"></i>';
                    iconEl.className = 'custom-alert-icon warning';
                    okBtn.style.backgroundColor = '';
                    okBtn.style.color = '';
                    okBtn.style.boxShadow = 'none';
                }

                overlay.classList.add('active');

                const handleResult = (result) => {
                    overlay.classList.remove('active');
                    okBtn.removeEventListener('click', handleOk);
                    cancelBtn.removeEventListener('click', handleCancel);
                    document.removeEventListener('keydown', handleKeyDown);
                    resolve(result);
                };

                const handleOk = () => handleResult(true);
                const handleCancel = () => handleResult(false);
                const handleKeyDown = (e) => {
                    if (e.key === 'Escape') {
                        handleResult(false);
                    } else if (e.key === 'Enter') {
                        handleResult(true);
                    }
                };

                okBtn.addEventListener('click', handleOk);
                cancelBtn.addEventListener('click', handleCancel);
                document.addEventListener('keydown', handleKeyDown);
                okBtn.focus();
            });
        }

        // Save native confirm just in case and override window.confirm
        if (!window.nativeConfirm) {
            window.nativeConfirm = window.confirm;
        }
        window.confirm = function(msg) {
            return customConfirm(msg);
        };

        function closeCustomConfirm(val) {
            const overlay = document.getElementById('custom-confirm-modal-overlay');
            if (overlay) overlay.classList.remove('active');
        }

        // Global Alert Override so all alert() calls use the styled alert box
        window.alert = function(msg) {
            customAlert(msg);
        };

        function closeCustomAlert() {
            const overlay = document.getElementById('custom-alert-modal-overlay');
            if (overlay) overlay.classList.remove('active');
        }

        // Get CSRF Token from meta, hidden form input, or cookies
        function getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }

        function getCsrfToken() {
            const meta = document.querySelector('meta[name="csrf-token"]');
            if (meta && meta.content && meta.content.length >= 32) return meta.content;
            const inputEl = document.querySelector('input[name="csrfmiddlewaretoken"]');
            if (inputEl && inputEl.value && inputEl.value.length >= 32) return inputEl.value;
            const cookie = getCookie('csrftoken');
            if (cookie && cookie.length >= 32) return cookie;
            return '';
        }
        const csrftoken = getCsrfToken();

        function selectProject(projectId, projectName) {
            const activeProjectEl = document.getElementById('active-project-name');
            if (activeProjectEl) activeProjectEl.innerText = projectName;

            const filterSelect = document.getElementById('project-filter');
            if (filterSelect) {
                filterSelect.value = projectId;
                renderKeysTable();
            }
        }

        // Simple SPA Tab Switching
        function switchTab(tabId) {
            if (typeof togglePlatformNav === 'function') togglePlatformNav(false);
            window.scrollTo({ top: 0 });
            document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));

            const targetContent = document.getElementById(tabId);
            if(targetContent) targetContent.classList.add('active');

            // Highlight the correct menu item
            document.querySelectorAll('.menu-item').forEach(el => {
                if(el.getAttribute('onclick') === `switchTab('${tabId}')`) el.classList.add('active');
            });

            const pageTitleEl = document.getElementById('page-title');
            if (tabId === 'chat') {
                pageTitleEl.style.display = 'none';
            } else {
                pageTitleEl.style.display = 'block';
                const titles = {
                    'home': 'Home', 'chat': 'Chat Playground', 'models': 'Models Catalog',
                    'apikeys': 'API Keys', 'projects': 'Projects', 'usage': 'Usage', 'account': 'Account & Profile',
                    'billing': 'Billing & Limits', 'settings': 'Settings', 'docs_heros': 'Heros Docs',
                    'docs_dev': 'Developer Documentation', 'data_controls': 'Data Controls & Governance',
                    'security_privacy': 'Security Architecture & Privacy',
                    'help': 'Help & Support', 'status': 'System Status', 'terms': 'Terms & Policies'
                };
                pageTitleEl.innerText = titles[tabId] || 'Platform';
            }

            if(tabId === 'apikeys') { loadKeys(); loadExternalKeysStatus(); }
            if(tabId === 'projects') loadProjectsSection();
            if(tabId === 'usage') loadUsage();
        }

        // Generate Key Modal Logic
        async function openKeyModal() {
            const overlay = document.getElementById('key-modal-overlay');
            const content = document.getElementById('key-modal-content');

            // Check if Gemini and OpenRouter provider keys are already set
            let extKeys = { gemini_set: false, openrouter_set: false };
            try {
                const checkRes = await fetch('/api/platform/keys/external/get');
                if (checkRes.ok) {
                    extKeys = await checkRes.json();
                }
            } catch(e) {
                console.warn("Could not check external keys pre-requisite:", e);
            }

            if (!extKeys.gemini_set || !extKeys.openrouter_set) {
                const missingList = [];
                if (!extKeys.gemini_set) missingList.push("Gemini API Key");
                if (!extKeys.openrouter_set) missingList.push("OpenRouter API Key");
                const missingText = missingList.join(" and ");

                content.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
                        <div class="pf-modal-icon warning">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0;">Upstream Provider Keys Required</h3>
                            <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--text-muted);">Heros multi-engine routing architecture</p>
                        </div>
                    </div>

                    <p class="pf-modal-text">
                        Before creating a Heros API key, please provide your <strong class="text-warning">${missingText}</strong>. Heros routes developer requests through these providers to ensure continuous uptime and low latency.
                    </p>

                    <div class="pf-prereq-box">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span class="pf-prereq-label">
                                <i class="fa-brands fa-google" style="color: #60a5fa; margin-right: 6px;"></i> Gemini API Key:
                            </span>
                            <span style="font-size: 0.78rem;">${extKeys.gemini_set ? '<span class="text-success">✓ Configured</span>' : '<span class="text-danger">Missing</span>'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="pf-prereq-label">
                                <i class="fa-solid fa-route" style="color: #c084fc; margin-right: 6px;"></i> OpenRouter API Key:
                            </span>
                            <span style="font-size: 0.78rem;">${extKeys.openrouter_set ? '<span class="text-success">✓ Configured</span>' : '<span class="text-danger">Missing</span>'}</span>
                        </div>
                    </div>

                    <div class="modal-footer" style="display: flex; justify-content: space-between; gap: 10px;">
                        <button class="btn btn-outline" onclick="closeKeyModal()">Cancel</button>
                        <button class="btn" onclick="closeKeyModal(); switchTab('apikeys'); setTimeout(() => { const el = document.getElementById('ext-gemini'); if (el) { el.scrollIntoView({ behavior: 'smooth' }); el.focus(); } }, 200);">
                            <i class="fa-solid fa-key"></i> Add Provider Keys
                        </button>
                    </div>
                `;
                overlay.classList.add('active');
                return;
            }

            const currentProjectId = document.getElementById('project-filter') ? document.getElementById('project-filter').value : '';

            const filterSelect = document.getElementById('project-filter');
            let projectOptions = '';
            if (filterSelect) {
                Array.from(filterSelect.options).forEach(opt => {
                    if (opt.value !== 'all') {
                        const isSel = opt.value === currentProjectId ? 'selected' : '';
                        projectOptions += `<option value="${opt.value}" ${isSel}>${opt.text}</option>`;
                    }
                });
            }
            if (!projectOptions) {
                projectOptions = (window.HEROS_PROJECTS || []).map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('');
            }

            content.innerHTML = `
                <h3>Create new secret key</h3>
                <p>Configure name, scoped permissions, environment, and expiration rule for security.</p>

                <div class="form-group">
                    <label>Key Name</label>
                    <input type="text" id="new-key-name" placeholder="e.g. Production Backend App" autofocus>
                </div>

                <div class="form-group">
                    <label>Project</label>
                    <select id="new-key-project" class="pg-select" style="width: 100%;">
                        ${projectOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label>Environment</label>
                    <select id="new-key-env" class="pg-select" style="width: 100%;">
                        <option value="live" selected>Production (Live)</option>
                        <option value="test">Development (Test)</option>
                        <option value="staging">Staging (Sandbox)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Permissions Scope</label>
                    <select id="new-key-scope" class="pg-select" style="width: 100%;">
                        <option value="full" selected>Full Access (Chat completions & all endpoints)</option>
                        <option value="read">Read-only (Usage & Analytics access)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Expiration</label>
                    <select id="new-key-expiry" class="pg-select" style="width: 100%;">
                        <option value="" selected>Never (No auto-expiration)</option>
                        <option value="30">30 Days</option>
                        <option value="60">60 Days</option>
                        <option value="90">90 Days</option>
                    </select>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeKeyModal()">Cancel</button>
                    <button class="btn" onclick="generateKey()" id="btn-generate">Create Key</button>
                </div>
            `;

            overlay.classList.add('active');

            // Allow enter key to submit
            setTimeout(() => {
                const input = document.getElementById('new-key-name');
                if(input) {
                    input.focus();
                    input.addEventListener('keypress', function (e) {
                        if (e.key === 'Enter') generateKey();
                    });
                }
            }, 100);
        }

        function closeKeyModal() {
            document.getElementById('key-modal-overlay').classList.remove('active');
        }

        // Project Creation Modal Logic
        function openCreateProjectModal() {
            const overlay = document.getElementById('key-modal-overlay');
            const content = document.getElementById('key-modal-content');

            content.innerHTML = `
                <h3>Create New Project</h3>
                <p>Projects organize secret API keys, environments, and usage metrics separately.</p>

                <div class="form-group">
                    <label>Project Name</label>
                    <input type="text" id="new-project-name" placeholder="e.g. Production Mobile App" autofocus>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeKeyModal()">Cancel</button>
                    <button class="btn" onclick="submitCreateProject()" id="btn-create-project">Create Project</button>
                </div>
            `;

            overlay.classList.add('active');

            setTimeout(() => {
                const input = document.getElementById('new-project-name');
                if(input) {
                    input.focus();
                    input.addEventListener('keypress', function (e) {
                        if (e.key === 'Enter') submitCreateProject();
                    });
                }
            }, 100);
        }

        async function submitCreateProject() {
            const nameInput = document.getElementById('new-project-name');
            const name = nameInput ? nameInput.value.trim() : '';
            if (!name) {
                customAlert('Please enter a project name', 'Validation Error', 'warning');
                return;
            }

            const btn = document.getElementById('btn-create-project');
            if (btn) { btn.innerText = 'Creating...'; btn.disabled = true; }

            try {
                const res = await fetch('/api/platform/projects/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({ name })
                });
                const data = await res.json();
                closeKeyModal();
                if (data.success) {
                    customAlert(`Project "${data.project.name}" created successfully!`, 'Project Created', 'success');
                    loadProjectsList(data.project.project_id);
                } else {
                    customAlert(data.error || 'Failed to create project', 'Error', 'error');
                }
            } catch(e) {
                closeKeyModal();
                alert('Request failed');
            }
        }

        async function loadProjectsList(selectProjectId = null) {
            try {
                const res = await fetch('/api/platform/projects/list');
                const data = await res.json();
                if (data.success) {
                    const projects = data.projects || [];

                    // Update Sidebar project list
                    const sidebarItems = document.getElementById('project-list-items');
                    if (sidebarItems) {
                        sidebarItems.innerHTML = projects.map(p => `
                            <div class="menu-item project-item" data-project-id="${p.project_id}" onclick="selectProject('${p.project_id}', '${p.name}'); document.getElementById('projectPopover').classList.remove('show'); event.stopPropagation();" style="padding: 6px 10px;">
                                <i class="fa-solid fa-folder"></i> <span>${p.name}</span>
                            </div>
                        `).join('');
                    }

                    // Update project filter dropdown
                    const filterSelect = document.getElementById('project-filter');
                    if (filterSelect) {
                        const currentVal = filterSelect.value;
                        filterSelect.innerHTML = '<option value="all">All projects</option>' + projects.map(p => `
                            <option value="${p.project_id}">${p.name}</option>
                        `).join('');
                        if (selectProjectId) filterSelect.value = selectProjectId;
                        else filterSelect.value = currentVal;
                    }

                    if (selectProjectId) {
                        const selectedP = projects.find(p => p.project_id === selectProjectId);
                        if (selectedP) selectProject(selectedP.project_id, selectedP.name);
                    }

                    _allProjects = projects;
                    const projTable = document.getElementById('projects-table-body');
                    if (projTable && document.getElementById('projects').classList.contains('active')) {
                        renderProjectsTable(_allProjects);
                    }
                }
            } catch(e) {
                console.error("Failed to load projects list", e);
            }
        }

        async function generateKey() {
            const nameInput = document.getElementById('new-key-name');
            const scopeInput = document.getElementById('new-key-scope');
            const envInput = document.getElementById('new-key-env');
            const expiryInput = document.getElementById('new-key-expiry');
            const projectInput = document.getElementById('new-key-project');

            const name = nameInput ? nameInput.value.trim() : "My API Key";
            const scope = scopeInput ? scopeInput.value : "full";
            const environment = envInput ? envInput.value : "live";
            const expiry_days = expiryInput ? expiryInput.value : null;
            const project_id = projectInput ? projectInput.value : null;

            const btn = document.getElementById('btn-generate');
            if(btn) { btn.innerText = "Creating..."; btn.disabled = true; }

            try {
                const res = await fetch('/api/platform/keys/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({
                        name: name || "My API Key",
                        scope: scope,
                        environment: environment,
                        expiry_days: expiry_days,
                        project_id: project_id
                    })
                });
                const data = await res.json();

                const content = document.getElementById('key-modal-content');
                if(data.success) {
                    content.innerHTML = `
                        <div class="key-generated-container">
                            <div class="key-generated-header">
                                <div class="key-generated-icon"><i class="fa-solid fa-circle-check"></i></div>
                                <div>
                                    <div class="key-generated-title">Key generated successfully</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted);">Your secret key is ready for authentication</div>
                                </div>
                            </div>

                            <div class="key-security-warning">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                                <div>
                                    <strong>Important Security Notice:</strong> Please save this secret key somewhere safe and accessible. For security reasons, <u>you won't be able to view it again</u> through your account.
                                </div>
                            </div>

                            <div>
                                <label style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Secret Key</label>
                                <div class="api-key-box">
                                    <span id="generated-key-text" style="user-select: all; word-break: break-all; letter-spacing: 0.4px;">${data.key}</span>
                                    <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.78rem; border-radius: 4px; white-space: nowrap; margin-left: 8px;" onclick="copyKeyToClipboard()" id="btn-copy-inline">
                                        <i class="fa-regular fa-copy"></i> Copy
                                    </button>
                                </div>
                            </div>

                            <div class="key-metadata-badges">
                                <div class="key-meta-badge">Scope: <strong style="color:var(--accent);">${data.scope === 'read' ? 'Read-Only' : 'Full Access'}</strong></div>
                                <div class="key-meta-badge">Env: <strong>${data.environment === 'test' ? 'Development' : (data.environment === 'staging' ? 'Staging' : 'Production')}</strong></div>
                                <div class="key-meta-badge">Expires: <strong>${data.expires_at ? new Date(data.expires_at).toLocaleDateString() : 'Never'}</strong></div>
                            </div>

                            <div class="modal-footer" style="margin-top: 6px; display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 14px;">
                                <button class="btn btn-outline" onclick="closeKeyModal()">Done</button>
                                <button class="btn" onclick="copyKeyToClipboard()" id="btn-copy">
                                    <i class="fa-regular fa-copy"></i> Copy Key
                                </button>
                            </div>
                        </div>
                    `;
                    loadKeys();
                } else {
                    const isMissingKeys = data.missing_keys && data.missing_keys.length > 0;
                    content.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div class="pf-modal-icon error">
                                <i class="fa-solid fa-circle-exclamation"></i>
                            </div>
                            <h3 style="margin: 0;">Unable to Create Key</h3>
                        </div>
                        <p class="pf-modal-text">${data.error || 'Failed to generate key'}</p>
                        <div class="modal-footer" style="display: flex; justify-content: space-between; gap: 10px;">
                            <button class="btn btn-outline" onclick="closeKeyModal()">Cancel</button>
                            ${isMissingKeys ? `
                                <button class="btn" onclick="closeKeyModal(); switchTab('apikeys'); setTimeout(() => { const el = document.getElementById('ext-gemini'); if (el) { el.scrollIntoView({ behavior: 'smooth' }); el.focus(); } }, 200);">
                                    <i class="fa-solid fa-key"></i> Go to Provider Keys
                                </button>
                            ` : `
                                <button class="btn" onclick="closeKeyModal()">Close</button>
                            `}
                        </div>
                    `;
                }
            } catch(e) {
                alert("Request failed");
                closeKeyModal();
            }
        }

        function copyKeyToClipboard() {
            const keyText = document.getElementById('generated-key-text').innerText.trim();
            navigator.clipboard.writeText(keyText).then(() => {
                const btn = document.getElementById('btn-copy');
                const btnInline = document.getElementById('btn-copy-inline');
                if (btn) btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                if (btnInline) btnInline.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                setTimeout(() => {
                    if (btn) btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Key';
                    if (btnInline) btnInline.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                }, 2000);
            }).catch(err => {
                customAlert('Failed to copy key: ' + err, 'Copy Error', 'error');
            });
        }

        function openQuotaModal() {
            const overlay = document.getElementById('key-modal-overlay');
            const content = document.getElementById('key-modal-content');

            content.innerHTML = `
                <h3>Request Quota & Rate Limit Increase</h3>
                <p>Select your target tier and describe your use case to upgrade your limit.</p>

                <div class="form-group">
                    <label>Requested Tier</label>
                    <select id="quota-tier-select" class="pg-select" style="width: 100%;">
                        <option value="Heros 5 Pro (500 req/min)">Heros 5 Pro (500 req/min, 200k TPM)</option>
                        <option value="Heros Enterprise (Custom)">Heros Enterprise (Custom Rate Limits & SLA)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Use Case & Production Details</label>
                    <textarea id="quota-reason" rows="3" class="pg-textarea" style="width:100%; min-height:80px;" placeholder="Describe expected request volume and application details..."></textarea>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeKeyModal()">Cancel</button>
                    <button class="btn" onclick="submitQuotaRequest()" id="btn-submit-quota">Submit Request <i class="fa-solid fa-rocket"></i></button>
                </div>
            `;

            overlay.classList.add('active');
        }

        async function submitQuotaRequest() {
            const tier = document.getElementById('quota-tier-select').value;
            const reason = document.getElementById('quota-reason').value.trim();
            const btn = document.getElementById('btn-submit-quota');

            if(btn) { btn.innerText = "Submitting..."; btn.disabled = true; }

            try {
                const res = await fetch('/api/platform/quota/increase', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({ tier, reason })
                });
                const data = await res.json();
                closeKeyModal();
                if(data.success) {
                    customAlert(data.message, "Quota Request Received", "success");
                } else {
                    customAlert(data.error || "Failed to submit request", "Error", "error");
                }
            } catch(e) {
                closeKeyModal();
                alert("Request failed. Please try again.");
            }
        }

        // ---- Usage Dashboard ----
        let _usageData = null;
        const KEY_COLORS = ['#22d3ee', '#3b82f6', '#f472b6', '#facc15', '#a78bfa', '#fb923c', 'var(--accent)', '#e879f9'];
        const ERROR_COLORS = {'400': '#3b82f6', '401': '#f59e0b', '403': '#ef4444', '404': '#22d3ee', '405': '#a78bfa', '429': '#f472b6', '500': '#ef4444', '503': '#fb923c'};

        async function loadUsage(manualRefresh = false) {
            const btn = document.getElementById('btn-refresh-usage');
            const icon = document.getElementById('icon-refresh-usage');
            const updatedEl = document.getElementById('usage-last-updated');

            if (manualRefresh && btn) {
                btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Refreshing...';
            }

            try {
                const res = await fetch('/api/platform/usage', {
                    headers: { 'Authorization': `Bearer ${getCookie('session_id')}` }
                });
                _usageData = await res.json();

                if (_usageData.status === 'success') {
                    if (updatedEl) {
                        const now = new Date();
                        updatedEl.innerText = `Last updated: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}`;
                    }

                    if (manualRefresh && btn) {
                        btn.innerHTML = '<span style="color: var(--accent); font-weight: bold;"><i class="fa-solid fa-check"></i></span> Refreshed!';
                        setTimeout(() => {
                            btn.innerHTML = '<span id="icon-refresh-usage"><i class="fa-solid fa-rotate"></i></span> Refresh Usage';
                        }, 1800);
                    }
                    // Update Home System Status & Latency Indicator
                    if (_usageData.system_status) {
                        const sysStatusEl = document.getElementById('home-system-status');
                        const avgLatEl = document.getElementById('home-avg-latency');
                        if (sysStatusEl) sysStatusEl.innerHTML = _usageData.system_status.indicator || 'All Systems Operational';
                        if (avgLatEl) avgLatEl.innerText = `${(_usageData.system_status.avg_latency_ms || 45).toFixed(0)}ms`;
                    }

                    // Update Rate Limits Panel
                    if (_usageData.rate_limits) {
                        const tierEl = document.getElementById('rate-limit-tier');
                        const rpmEl = document.getElementById('rate-limit-rpm');
                        const tpmEl = document.getElementById('rate-limit-tpm');
                        const h4El = document.getElementById('rate-limit-h4');
                        const dailyEl = document.getElementById('rate-limit-daily');

                        const rpmResetEl = document.getElementById('rate-limit-rpm-reset');
                        const tpmResetEl = document.getElementById('rate-limit-tpm-reset');
                        const h4ResetEl = document.getElementById('rate-limit-h4-reset');
                        const dailyResetEl = document.getElementById('rate-limit-daily-reset');

                        if (tierEl) tierEl.innerText = _usageData.rate_limits.tier;
                        if (rpmEl) rpmEl.innerText = `${_usageData.rate_limits.rpm_used || 0} / ${_usageData.rate_limits.requests_per_min} req / min`;
                        if (tpmEl) tpmEl.innerText = `${(_usageData.rate_limits.tpm_used || 0).toLocaleString()} / ${(_usageData.rate_limits.tokens_per_min || 40000).toLocaleString()} tokens / min`;
                        if (h4El) h4El.innerText = `${_usageData.rate_limits.window_4h_used || 0} / ${_usageData.rate_limits.window_4h_limit || 250} req / 4 hours`;
                        if (dailyEl) dailyEl.innerText = `${(_usageData.rate_limits.daily_used || 0).toLocaleString()} / ${(_usageData.rate_limits.daily_request_limit || 1000).toLocaleString()} req / day`;

                        if (rpmResetEl && _usageData.rate_limits.rpm_reset_human) rpmResetEl.innerText = _usageData.rate_limits.rpm_reset_human;
                        if (tpmResetEl && _usageData.rate_limits.tpm_reset_human) tpmResetEl.innerText = _usageData.rate_limits.tpm_reset_human;
                        if (h4ResetEl && _usageData.rate_limits.window_4h_reset_human) h4ResetEl.innerText = _usageData.rate_limits.window_4h_reset_human;
                        if (dailyResetEl && _usageData.rate_limits.daily_reset_human) dailyResetEl.innerText = _usageData.rate_limits.daily_reset_human;
                    }

                    // Populate Model Breakdown Progress Bars
                    renderModelBreakdown();

                    // Populate Project Usage Breakdown
                    renderProjectUsageBreakdown();

                    // Summary cards
                    document.getElementById('usage-requests').innerText = `${_usageData.today_requests} / ${_usageData.daily_limit}`;
                    document.getElementById('usage-tokens').innerText = (_usageData.today_tokens || 0).toLocaleString();
                    document.getElementById('usage-prompt-tokens').innerText = (_usageData.today_prompt_tokens || 0).toLocaleString();
                    document.getElementById('usage-completion-tokens').innerText = (_usageData.today_completion_tokens || 0).toLocaleString();
                    document.getElementById('usage-success').innerText = _usageData.today_success || 0;
                    document.getElementById('usage-errors').innerText = _usageData.today_errors || 0;
                    document.getElementById('usage-cost').innerText = `$${(_usageData.today_cost || 0).toFixed(4)}`;
                    document.getElementById('usage-latency').innerText = `${(_usageData.avg_latency_ms || 0).toFixed(0)}ms`;

                    // Populate Request Logs
                    const reqLogTbody = document.getElementById('usage-request-logs');
                    if (_usageData.request_logs && _usageData.request_logs.length > 0) {
                        reqLogTbody.innerHTML = '';
                        _usageData.request_logs.slice(0, 10).forEach(log => {
                            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            const statusColor = log.status_code === 200 ? 'var(--accent)' : '#ef4444';
                            reqLogTbody.innerHTML += `
                                <tr>
                                    <td>${timeStr}</td>
                                    <td>${log.model || log.model_used || 'Unknown'}</td>
                                    <td>${log.tokens || 0}</td>
                                    <td>${(log.latency_ms || 0).toFixed(0)}ms</td>
                                    <td style="color:${statusColor}; font-weight:500;"><span class="badge">${log.status_code || 200}</span></td>
                                </tr>
                            `;
                        });
                    }

                    // Populate Activity Logs
                    const actLogTbody = document.getElementById('usage-activity-logs');
                    if (_usageData.activity_logs && _usageData.activity_logs.length > 0) {
                        actLogTbody.innerHTML = '';
                        _usageData.activity_logs.slice(0, 10).forEach(log => {
                            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            actLogTbody.innerHTML += `
                                <tr>
                                    <td>${timeStr}</td>
                                    <td><span class="badge">${log.action}</span></td>
                                    <td style="color:var(--text-muted);">${log.details || ''}</td>
                                </tr>
                            `;
                        });
                    }

                    // Populate key dropdown
                    const select = document.getElementById('usage-key-filter');
                    select.innerHTML = '<option value="all">All API Keys</option>';
                    (_usageData.api_keys || []).forEach(k => {
                        const opt = document.createElement('option');
                        opt.value = k.key_hash;
                        opt.textContent = k.name;
                        select.appendChild(opt);
                    });

                    renderUsageCharts();
                }
            } catch (error) {
                console.error("Failed to load usage", error);
            }
        }

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // ---- Model Breakdown Filter Logic ----
        function filterModelBreakdown() {
            renderModelBreakdown();
        }

        function renderModelBreakdown() {
            if (!_usageData) return;
            const modelListEl = document.getElementById('model-breakdown-list');
            const modelCountEl = document.getElementById('usage-model-count');
            const filterEl = document.getElementById('usage-model-filter');
            const selectedFilter = filterEl ? filterEl.value : 'all';

            let rawList = _usageData.model_breakdown || [];
            if (selectedFilter !== 'all') {
                rawList = rawList.filter(m => (m.model || '').toLowerCase().includes(selectedFilter.toLowerCase()));
            }

            if (rawList.length > 0) {
                if (modelCountEl) modelCountEl.innerText = `${rawList.length} Active Model${rawList.length > 1 ? 's' : ''}`;
                modelListEl.innerHTML = '';
                const maxTokens = Math.max(...rawList.map(m => m.tokens || 1), 1);

                rawList.forEach((m, idx) => {
                    const pct = Math.min(Math.round((m.tokens / maxTokens) * 100), 100);
                    const color = KEY_COLORS[idx % KEY_COLORS.length];

                    modelListEl.innerHTML += `
                        <div style="background: var(--bg-dark); padding: 12px 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <span style="font-weight: 500; font-size: 0.9rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                                    <span style="width: 10px; height: 10px; border-radius: 2px; background: ${color}; display: inline-block;"></span>
                                    ${escapeHtml(m.model)}
                                </span>
                                <span style="font-size: 0.82rem; color: var(--text-muted);">
                                    <strong>${(m.tokens || 0).toLocaleString()}</strong> tokens (${m.requests} reqs) | 
                                    <strong>$${(m.cost || 0).toFixed(4)}</strong>
                                </span>
                            </div>
                            <div style="width: 100%; height: 6px; background: var(--surface-3); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${pct}%; height: 100%; background: ${color}; transition: width 0.4s ease;"></div>
                            </div>
                        </div>
                    `;
                });
            } else {
                const label = selectedFilter === 'all' ? 'any model' : selectedFilter;
                if (modelCountEl) modelCountEl.innerText = selectedFilter === 'all' ? '0 Models' : selectedFilter;
                modelListEl.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 20px;">No usage data recorded for ${escapeHtml(label)} yet.</div>`;
            }
        }

        // ---- Project Usage Breakdown on Usage Tab ----
        function renderProjectUsageBreakdown() {
            if (!_usageData) return;
            const tbody = document.getElementById('project-usage-table-body');
            if (!tbody) return;

            const projects = _usageData.project_breakdown || [];
            if (projects.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No project usage recorded yet.</td></tr>';
                return;
            }

            const maxTokens = Math.max(...projects.map(p => p.tokens || 1), 1);

            tbody.innerHTML = projects.map(p => {
                const pct = Math.min(Math.round(((p.tokens || 0) / maxTokens) * 100), 100);
                return `
                    <tr>
                        <td>
                            <div class="project-name-cell">
                                <a class="project-title-link" onclick="switchTab('projects')">${escapeHtml(p.name)}</a>
                                <span class="project-id-subtext">${escapeHtml(p.client_id || '')}</span>
                            </div>
                        </td>
                        <td>
                            <span style="background: rgba(16, 185, 129, 0.12); color: var(--accent); font-size: 0.76rem; font-weight: 500; padding: 3px 8px; border-radius: 4px;">
                                ${p.keys_count} ${p.keys_count === 1 ? 'key' : 'keys'}
                            </span>
                        </td>
                        <td style="color: var(--text-main); font-weight: 500;">
                            ${(p.requests || 0).toLocaleString()} reqs
                        </td>
                        <td style="color: var(--text-main);">
                            ${(p.tokens || 0).toLocaleString()}
                        </td>
                        <td style="color: var(--text-muted);">
                            ${p.cost > 0 ? '$' + p.cost.toFixed(4) : '-'}
                        </td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="flex: 1; height: 6px; background: var(--surface-3); border-radius: 3px; overflow: hidden;">
                                    <div style="width: ${pct}%; height: 100%; background: var(--accent); border-radius: 3px;"></div>
                                </div>
                                <span style="font-size: 0.75rem; color: var(--text-muted); min-width: 32px;">${pct}%</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // ---- Projects Section Logic (Matching Google AI Studio Console) ----
        let _allProjects = [];

        async function loadProjectsSection() {
            const tbody = document.getElementById('projects-table-body');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Loading projects...</td></tr>';

            try {
                const res = await fetch('/api/platform/projects/list');
                const data = await res.json();
                if (data.success) {
                    _allProjects = data.projects || [];
                    renderProjectsTable(_allProjects);
                } else {
                    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 20px;">${data.error || 'Failed to load projects'}</td></tr>`;
                }
            } catch(e) {
                if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 20px;">Error loading projects.</td></tr>';
            }
        }

        function filterProjectsTable() {
            const searchInput = document.getElementById('projects-search-input');
            const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
            if (!q) {
                renderProjectsTable(_allProjects);
                return;
            }
            const filtered = _allProjects.filter(p => 
                (p.name || '').toLowerCase().includes(q) || 
                (p.client_id || '').toLowerCase().includes(q) || 
                (p.project_id || '').toLowerCase().includes(q)
            );
            renderProjectsTable(filtered);
        }

        function renderProjectsTable(projectsToRender) {
            const tbody = document.getElementById('projects-table-body');
            if (!tbody) return;

            if (projectsToRender.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No projects found.</td></tr>';
                return;
            }

            tbody.innerHTML = projectsToRender.map(p => `
                <tr id="proj-row-${p.project_id}">
                    <td>
                        <div class="project-name-cell">
                            <a class="project-title-link" onclick="viewProjectKeys('${p.project_id}', '${escapeHtml(p.name)}')">${escapeHtml(p.name)}</a>
                            <span class="project-id-subtext">${escapeHtml(p.client_id || '')}</span>
                        </div>
                    </td>
                    <td>
                        <a class="project-keys-link" onclick="viewProjectKeys('${p.project_id}', '${escapeHtml(p.name)}')">
                            ${p.keys_count} ${p.keys_count === 1 ? 'key' : 'keys'}
                        </a>
                    </td>
                    <td>
                        <span style="color: var(--text-main); font-size: 0.85rem;">${p.created_at}</span>
                    </td>
                    <td>
                        <span style="color: var(--text-muted); font-size: 0.85rem;">${p.monthly_spend || '-'}</span>
                    </td>
                    <td>
                        <div class="project-billing-cell">
                            <a class="project-billing-link" onclick="switchTab('billing')">Set up billing</a>
                            <span class="project-tier-subtext">${escapeHtml(p.billing_tier || 'Free tier')}</span>
                        </div>
                    </td>
                    <td>
                        <div class="project-actions-cell">
                            <button class="project-action-btn" title="Copy Client ID" onclick="copyText('${p.client_id}', this)">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                            <button class="project-action-btn" title="Billing & Plans" onclick="switchTab('billing')">
                                <i class="fa-solid fa-dollar-sign"></i>
                            </button>
                            <button class="project-action-btn" title="View Usage" onclick="switchTab('usage')">
                                <i class="fa-solid fa-chart-simple"></i>
                            </button>
                            <button class="project-action-btn" title="API Keys" onclick="viewProjectKeys('${p.project_id}', '${escapeHtml(p.name)}')">
                                <i class="fa-solid fa-database"></i>
                            </button>
                            <button class="project-action-btn project-delete-btn" title="Delete Project" onclick="deleteProjectPrompt('${p.project_id}', '${escapeHtml(p.name)}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function viewProjectKeys(projectId, projectName) {
            selectProject(projectId, projectName);
            switchTab('apikeys');
        }

        async function deleteProjectPrompt(projectId, projectName) {
            const confirmed = await customConfirm(`Are you sure you want to delete project "${projectName}"? This will permanently delete this project, all API keys belonging to it, and its usage records.`);
            if (!confirmed) return;

            try {
                const res = await fetch(`/api/platform/projects/delete/${projectId}`, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrftoken }
                });
                const data = await res.json();
                if (data.success) {
                    customAlert(`Project "${projectName}" and its API keys have been deleted.`, 'Project Deleted', 'success');
                    loadProjectsSection();
                    if (typeof loadProjectsList === 'function') loadProjectsList();
                    if (typeof loadKeys === 'function') loadKeys();
                    if (typeof loadUsage === 'function') loadUsage();
                } else {
                    customAlert(data.error || 'Failed to delete project', 'Error', 'error');
                }
            } catch(e) {
                customAlert('Failed to delete project', 'Error', 'error');
            }
        }

        function copyText(text, btnEl) {
            navigator.clipboard.writeText(text).then(() => {
                if (btnEl) {
                    const original = btnEl.innerHTML;
                    btnEl.innerHTML = '<i class="fa-solid fa-check" style="color: var(--accent);"></i>';
                    setTimeout(() => btnEl.innerHTML = original, 1800);
                }
            });
        }

        function renderUsageCharts() {
            if (!_usageData) return;
            const data = _usageData;
            const labels = data.date_labels || [];
            const filter = document.getElementById('usage-key-filter').value;

            // ---- REQUESTS CHART (stacked bars + success rate line) ----
            const reqChart = document.getElementById('requests-chart');
            const reqXAxis = document.getElementById('requests-x-axis');
            const reqLegend = document.getElementById('requests-legend');
            reqChart.innerHTML = '';
            reqXAxis.innerHTML = '';
            reqLegend.innerHTML = '';

            const rpk = data.requests_per_key || {};
            const keyNames = Object.keys(rpk);
            const successRate = data.success_rate || {};

            // Filter keys
            let filteredKeys = keyNames;
            if (filter !== 'all') {
                const matchName = (data.api_keys || []).find(k => k.key_hash === filter);
                if (matchName) filteredKeys = keyNames.filter(k => k === matchName.name);
            }

            // Compute max for scaling
            let maxReq = 10;
            labels.forEach(d => {
                let dayTotal = 0;
                filteredKeys.forEach(k => { dayTotal += (rpk[k]?.[d] || 0); });
                if (dayTotal > maxReq) maxReq = dayTotal;
            });

            // SVG success rate line points
            const chartWidth = reqChart.clientWidth || 600;
            const chartHeight = 220;

            labels.forEach((date, idx) => {
                const col = document.createElement('div');
                col.style.cssText = 'display:flex;flex-direction:column;justify-content:flex-end;flex:1;height:100%;position:relative;';

                let dayTotal = 0;
                filteredKeys.forEach((keyName, ki) => {
                    const val = rpk[keyName]?.[date] || 0;
                    if (val === 0) return;
                    dayTotal += val;
                    const seg = document.createElement('div');
                    seg.style.cssText = `width:100%;height:${(val/maxReq)*100}%;background:${KEY_COLORS[ki % KEY_COLORS.length]};transition:height 0.3s ease;`;
                    if (ki === filteredKeys.length - 1) seg.style.borderRadius = '3px 3px 0 0';
                    col.appendChild(seg);
                });

                // Tooltip
                let tip = `${date}\n`;
                filteredKeys.forEach(k => { tip += `${k}: ${rpk[k]?.[date] || 0}\n`; });
                tip += `Success Rate: ${successRate[date] != null ? successRate[date] + '%' : 'N/A'}`;
                col.title = tip;

                reqChart.appendChild(col);

                // X axis label (show every 5th)
                const lbl = document.createElement('div');
                lbl.style.cssText = 'flex:1;text-align:center;font-size:0.6rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;';
                if (idx % 5 === 0 || idx === labels.length - 1) {
                    const parts = date.split('-');
                    lbl.textContent = `${parts[1]}/${parts[2]}`;
                }
                reqXAxis.appendChild(lbl);
            });

            // Success rate overlay (draw dots via absolute positioned elements)
            labels.forEach((date, idx) => {
                const rate = successRate[date];
                if (rate == null) return;
                const dot = document.createElement('div');
                const left = ((idx + 0.5) / labels.length) * 100;
                const bottom = (rate / 100) * 100;
                dot.style.cssText = `position:absolute;left:${left}%;bottom:${bottom}%;width:6px;height:6px;border-radius:50%;background:var(--accent);transform:translate(-50%,50%);z-index:2;pointer-events:none;`;
                reqChart.appendChild(dot);
            });

            // Legend
            filteredKeys.forEach((k, i) => {
                const item = document.createElement('span');
                item.style.cssText = 'display:flex;align-items:center;gap:5px;';
                item.innerHTML = `<span style="width:10px;height:10px;border-radius:2px;background:${KEY_COLORS[i % KEY_COLORS.length]};display:inline-block;"></span> ${k}`;
                reqLegend.appendChild(item);
            });
            const srItem = document.createElement('span');
            srItem.style.cssText = 'display:flex;align-items:center;gap:5px;';
            srItem.innerHTML = `<span style="width:10px;height:10px;border-radius:50%;background:var(--accent);display:inline-block;"></span> Success Rate`;
            reqLegend.appendChild(srItem);

            // ---- ERRORS CHART (stacked bars per error code) ----
            const errChart = document.getElementById('errors-chart');
            const errXAxis = document.getElementById('errors-x-axis');
            const errLegend = document.getElementById('errors-legend');
            errChart.innerHTML = '';
            errXAxis.innerHTML = '';
            errLegend.innerHTML = '';

            const epc = data.errors_per_code || {};
            const errorKeys = Object.keys(epc);

            if (errorKeys.length === 0) {
                errChart.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--text-muted);font-size:0.9rem;">No errors recorded</div>';
            } else {
                let maxErr = 1;
                labels.forEach(d => {
                    let dayTotal = 0;
                    errorKeys.forEach(k => { dayTotal += (epc[k]?.[d] || 0); });
                    if (dayTotal > maxErr) maxErr = dayTotal;
                });

                labels.forEach((date, idx) => {
                    const col = document.createElement('div');
                    col.style.cssText = 'display:flex;flex-direction:column;justify-content:flex-end;flex:1;height:100%;';

                    let tip = `${date}\n`;
                    errorKeys.forEach((ek, ei) => {
                        const val = epc[ek]?.[date] || 0;
                        tip += `${ek}: ${val}\n`;
                        if (val === 0) return;
                        const code = ek.split(' ')[0];
                        const seg = document.createElement('div');
                        seg.style.cssText = `width:100%;height:${(val/maxErr)*100}%;background:${ERROR_COLORS[code] || '#ef4444'};transition:height 0.3s ease;`;
                        if (ei === errorKeys.length - 1) seg.style.borderRadius = '3px 3px 0 0';
                        col.appendChild(seg);
                    });
                    col.title = tip.trim();
                    errChart.appendChild(col);

                    const lbl = document.createElement('div');
                    lbl.style.cssText = 'flex:1;text-align:center;font-size:0.6rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;';
                    if (idx % 5 === 0 || idx === labels.length - 1) {
                        const parts = date.split('-');
                        lbl.textContent = `${parts[1]}/${parts[2]}`;
                    }
                    errXAxis.appendChild(lbl);
                });

                errorKeys.forEach(ek => {
                    const code = ek.split(' ')[0];
                    const item = document.createElement('span');
                    item.style.cssText = 'display:flex;align-items:center;gap:5px;';
                    item.innerHTML = `<span style="width:10px;height:10px;border-radius:2px;background:${ERROR_COLORS[code] || '#ef4444'};display:inline-block;"></span> ${ek}`;
                    errLegend.appendChild(item);
                });
            }

            // ---- TOKENS CHART (stacked prompt + completion) ----
            const tokChart = document.getElementById('tokens-chart');
            const tokXAxis = document.getElementById('tokens-x-axis');
            tokChart.innerHTML = '';
            tokXAxis.innerHTML = '';

            const tpd = data.tokens_per_day || {};
            let maxTok = 10;
            labels.forEach(d => {
                const t = (tpd[d]?.total || 0);
                if (t > maxTok) maxTok = t;
            });

            labels.forEach((date, idx) => {
                const prompt = tpd[date]?.prompt || 0;
                const completion = tpd[date]?.completion || 0;
                const total = prompt + completion;

                const col = document.createElement('div');
                col.style.cssText = 'display:flex;flex-direction:column;justify-content:flex-end;flex:1;height:100%;';
                col.title = `${date}\nPrompt: ${prompt.toLocaleString()}\nCompletion: ${completion.toLocaleString()}\nTotal: ${total.toLocaleString()}`;

                if (prompt > 0) {
                    const seg = document.createElement('div');
                    seg.style.cssText = `width:100%;height:${(prompt/maxTok)*100}%;background:#22d3ee;transition:height 0.3s ease;`;
                    col.appendChild(seg);
                }
                if (completion > 0) {
                    const seg = document.createElement('div');
                    seg.style.cssText = `width:100%;height:${(completion/maxTok)*100}%;background:#a78bfa;border-radius:3px 3px 0 0;transition:height 0.3s ease;`;
                    col.appendChild(seg);
                }

                tokChart.appendChild(col);

                const lbl = document.createElement('div');
                lbl.style.cssText = 'flex:1;text-align:center;font-size:0.6rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;';
                if (idx % 5 === 0 || idx === labels.length - 1) {
                    const parts = date.split('-');
                    lbl.textContent = `${parts[1]}/${parts[2]}`;
                }
                tokXAxis.appendChild(lbl);
            });
        }

        function toggleKeyVisibility(inputId, btnEl) {
            const input = document.getElementById(inputId);
            if (!input) return;
            const isMasked = input.style.webkitTextSecurity !== 'none';
            if (isMasked) {
                input.style.webkitTextSecurity = 'none';
                input.style.mozTextSecurity = 'none';
                input.style.textSecurity = 'none';
                btnEl.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
            } else {
                input.style.webkitTextSecurity = 'disc';
                input.style.mozTextSecurity = 'disc';
                input.style.textSecurity = 'disc';
                btnEl.innerHTML = '<i class="fa-regular fa-eye"></i>';
            }
        }

        let allKeysData = [];
        let groupMode = 'apikey';

        async function loadKeys() {
            try {
                const res = await fetch('/api/platform/keys/list');
                const data = await res.json();
                allKeysData = data.keys || [];
                renderKeysTable();
            } catch (err) {
                console.error("Failed to load keys:", err);
            }
        }

        function setGroupMode(mode, btnEl) {
            groupMode = mode;
            document.querySelectorAll('.studio-segment-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.innerHTML = btn.innerText; // remove icon
            });
            btnEl.classList.add('active');
            btnEl.innerHTML = '<i class="fa-solid fa-circle" style="font-size: 5px; vertical-align: middle; margin-right: 4px;"></i> ' + btnEl.innerText;
            renderKeysTable();
        }

        function renderKeysTable() {
            try {
                const tbody = document.getElementById('keys-body');
                tbody.innerHTML = '';

            if (allKeysData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; color: var(--text-muted); padding: 20px;">No secret API keys created yet.</td></tr>';
                return;
            }

            const filterVal = document.getElementById('project-filter') ? document.getElementById('project-filter').value : 'all';

            let filteredKeys = allKeysData;
            if (filterVal !== 'all') {
                filteredKeys = allKeysData.filter(k => k.project_id === filterVal);
            }

            if (groupMode === 'project') {
                filteredKeys = [...filteredKeys].sort((a, b) => (a.project_name || '').localeCompare(b.project_name || ''));
            }

            if (filteredKeys.length === 0) {
                tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; color: var(--text-muted); padding: 20px;">No keys found for this project.</td></tr>';
                return;
            }

                const scopeBadges = {
                    'full': '<span class="badge badge-accent">Full Access</span>',
                    'read': '<span class="badge">Read-Only</span>',
                    'playground': '<span class="badge">Playground</span>'
                };

                const envBadges = {
                    'live': '<span class="badge">Production</span>',
                    'test': '<span class="badge">Development</span>',
                    'staging': '<span class="badge">Staging</span>'
                };

                filteredKeys.forEach(k => {
                    const createdStr = new Date(k.created_at).toLocaleDateString();
                    const expiresStr = (k.expires_at && k.expires_at !== 'Never') ? new Date(k.expires_at).toLocaleDateString() : 'Never';
                    const lastUsedStr = (k.last_used && k.last_used !== 'Never') ? new Date(k.last_used).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'Never';
                    const spendStr = `$${(k.spend || 0).toFixed(4)}`;
                    const scopeBadge = scopeBadges[k.scope] || scopeBadges['full'];
                    const envBadge = envBadges[k.environment] || envBadges['live'];
                    const statusBadge = k.is_active 
                        ? '<span style="color: var(--accent); font-weight: 500; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;"><span style="width:6px;height:6px;border-radius:50%;background:var(--accent);display:inline-block;"></span> Active</span>'
                        : '<span style="color: #ef4444; font-weight: 500; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;"><span style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block;"></span> Paused</span>';

                    const toggleBtnText = k.is_active ? "Pause" : "Enable";
                    const toggleBtnStyle = k.is_active 
                        ? "border-color: var(--border-color); color: var(--text-muted);" 
                        : "border-color: var(--accent); color: var(--accent);";

                    tbody.innerHTML += `
                        <tr>
                            <td style="font-weight: 500;">${k.name}</td>
                            <td><span style="color: var(--text-muted); font-size: 0.85rem;">${k.project_name}</span></td>
                            <td>${scopeBadge}</td>
                            <td>${envBadge}</td>
                            <td style="font-family: monospace; color: var(--text-muted);"><code>${escapeHtml(k.masked_key || 'sk-hero-••••••••')}</code></td>
                            <td style="font-size: 0.85rem;">${createdStr}</td>
                            <td style="font-size: 0.85rem;">${expiresStr}</td>
                            <td style="font-size: 0.85rem; color: var(--text-muted);">${lastUsedStr}</td>
                            <td style="font-weight: 500; ">${spendStr}</td>
                            <td>${statusBadge}</td>
                            <td>
                                <div style="display: flex; gap: 6px; align-items: center;">
                                    <button class="btn-outline" style="padding: 4px 8px; font-size: 0.8rem; ${toggleBtnStyle}" onclick="toggleKeyStatus('${k.id}')">${toggleBtnText}</button>
                                    <button class="btn-outline" style="padding: 4px 8px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" onclick="deleteKey('${k.id}')">Revoke</button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            } catch(e) {
                console.error(e);
            }
        }

        async function toggleKeyStatus(hash) {
            try {
                const res = await fetch(`/api/platform/keys/toggle/${hash}`, { 
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrftoken }
                });
                const data = await res.json();
                if(data.success) loadKeys();
                else alert(data.error || "Failed to toggle key status");
            } catch(e) {
                alert("Failed to toggle key status");
            }
        }

        // Revoke Key logic
        async function deleteKey(hash) {
            const confirmed = await customConfirm("Are you sure you want to revoke this key? This cannot be undone.", "Revoke API Key", "Revoke Key", "danger");
            if (!confirmed) return;
            try {
                const res = await fetch(`/api/platform/keys/delete/${hash}`, { 
                    method: 'DELETE',
                    headers: { 'X-CSRFToken': csrftoken }
                });
                const data = await res.json();
                if(data.success) loadKeys();
                else alert(data.error);
            } catch(e) {
                alert("Failed to delete key");
            }
        }

        async function loadExternalKeysStatus() {
            try {
                const res = await fetch('/api/platform/keys/external/get');
                const data = await res.json();

                const updateBadge = (id, isSet) => {
                    const badge = document.getElementById(id);
                    if (!badge) return;
                    if (isSet) {
                        badge.innerHTML = '<span style="color: var(--accent); font-weight: 500;">✓ Configured</span>';
                    } else {
                        badge.innerHTML = '<span style="color: var(--text-muted);">Not set</span>';
                    }
                };

                updateBadge('ext-gemini-badge', data.gemini_set);
                updateBadge('ext-groq-badge', data.groq_set);
                updateBadge('ext-or-badge', data.openrouter_set);
                updateBadge('ext-hf-badge', data.huggingface_set);
            } catch(e) {
                console.error("Failed to load external keys status:", e);
            }
        }

        // External Keys Logic
        async function saveExternalKeys() {
            const btn = document.getElementById('btn-save-ext-keys');
            if (btn) { btn.innerText = "Saving..."; btn.disabled = true; }

            const payload = {
                gemini_key: document.getElementById('ext-gemini').value,
                groq_key: document.getElementById('ext-groq').value,
                openrouter_key: document.getElementById('ext-or').value,
                huggingface_key: document.getElementById('ext-hf').value
            };
            try {
                const res = await fetch('/api/platform/keys/external', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if(data.success) {
                    customAlert("External provider keys saved securely!", "Keys Saved", "success");
                    document.getElementById('ext-gemini').value = '';
                    document.getElementById('ext-groq').value = '';
                    document.getElementById('ext-or').value = '';
                    document.getElementById('ext-hf').value = '';
                    loadExternalKeysStatus();
                } else alert(data.error || "Failed to save keys");
            } catch(e) {
                alert("Failed to save keys");
            } finally {
                if (btn) { btn.innerText = "Save Provider Keys"; btn.disabled = false; }
            }
        }

        async function testExternalKey(provider) {
            const inputIdMap = {
                'gemini': 'ext-gemini',
                'groq': 'ext-groq',
                'openrouter': 'ext-or',
                'huggingface': 'ext-hf'
            };
            const btnIdMap = {
                'gemini': 'btn-test-gemini',
                'groq': 'btn-test-groq',
                'openrouter': 'btn-test-or',
                'huggingface': 'btn-test-hf'
            };
            const resIdMap = {
                'gemini': 'ext-gemini-test-res',
                'groq': 'ext-groq-test-res',
                'openrouter': 'ext-or-test-res',
                'huggingface': 'ext-hf-test-res'
            };

            const inputEl = document.getElementById(inputIdMap[provider]);
            const btnEl = document.getElementById(btnIdMap[provider]);
            const resEl = document.getElementById(resIdMap[provider]);

            const apiKey = inputEl ? inputEl.value.trim() : '';

            if (btnEl) { btnEl.innerText = "Testing..."; btnEl.disabled = true; }
            if (resEl) { resEl.style.display = 'block'; resEl.style.color = 'var(--text-muted)'; resEl.innerText = "Connecting to provider API..."; }

            try {
                const res = await fetch('/api/platform/keys/test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({ provider, api_key: apiKey })
                });
                const data = await res.json();
                if (data.success) {
                    if (resEl) {
                        resEl.style.color = 'var(--accent)';
                        resEl.innerHTML = `✓ ${data.message}`;
                    }
                } else {
                    if (resEl) {
                        resEl.style.color = '#ef4444';
                        resEl.innerHTML = `✗ ${data.error}`;
                    }
                }
            } catch(e) {
                if (resEl) {
                    resEl.style.color = '#ef4444';
                    resEl.innerText = "✗ Connection test failed";
                }
            } finally {
                if (btnEl) { btnEl.innerHTML = '<i class="fa-solid fa-bolt"></i> Test Connection'; btnEl.disabled = false; }
            }
        }

        // Send Support Email Logic
        async function sendHelpEmail() {
            const subjectInput = document.getElementById('help-subject');
            const messageInput = document.getElementById('help-message');
            const subject = subjectInput ? subjectInput.value.trim() : '';
            const message = messageInput ? messageInput.value.trim() : '';
            if(!subject || !message) {
                customAlert("Please fill out both the subject and message fields.", "Incomplete Request", "warning");
                return;
            }

            try {
                const res = await fetch('/api/platform/help/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({subject, message})
                });
                const data = await res.json();
                if(data.success) {
                    customAlert(data.message || "Support ticket submitted successfully!", "Ticket Received", "success");
                    if (subjectInput) subjectInput.value = '';
                    if (messageInput) messageInput.value = '';
                } else {
                    customAlert(data.error || "Failed to submit support ticket", "Submission Error", "error");
                }
            } catch(e) {
                customAlert("Network error while submitting support ticket.", "Connection Error", "error");
            }
        }
        // Playground Chat Logic
        let chatSessionId = null;

        const providerModels = {
            'custom-gemini': [
                {value: 'gemini-3.6-flash', label: 'gemini-3.6-flash'},
                {value: 'gemini-3.5-flash', label: 'gemini-3.5-flash'},
                {value: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite'},
                {value: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite'},
                {value: 'gemini-2.5-flash', label: 'gemini-2.5-flash'},
                {value: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite'},
                {value: 'gemini-flash-latest', label: 'gemini-flash-latest'},
                {value: 'custom', label: 'Custom Input...'}
            ],
            'custom-groq': [
                {value: 'allam-2-7b', label: 'allam-2-7b'},
                {value: 'openai/gpt-oss-20b', label: 'openai/gpt-oss-20b'},
                {value: 'qwen/qwen3.8-27b', label: 'qwen/qwen3.8-27b'},
                {value: 'openai/gpt-oss-120b', label: 'openai/gpt-oss-120b'},
                {value: 'custom', label: 'Custom Input...'}
            ],
            'custom-openrouter': [
                {value: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'nvidia/nemotron-3-super-120b-a12b:free'},
                {value: 'meta-llama/llama-3.2-3b-instruct:free', label: 'meta-llama/llama-3.2-3b-instruct:free'},
                {value: 'google/gemma-2-9b-it:free', label: 'google/gemma-2-9b-it:free'},
                {value: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'nvidia/nemotron-3-ultra-550b-a55b:free'},
                {value: 'nvidia/nemotron-3.5-lightning:free', label: 'nvidia/nemotron-3.5-lightning:free'},
                {value: 'custom', label: 'Custom Input...'}
            ]
        };

        // Playground JS Logic
        function togglePgSection(bodyId, arrowId) {
            const body = document.getElementById(bodyId);
            const arrow = document.getElementById(arrowId);
            if (body.style.display === 'none') {
                body.style.display = bodyId === 'model-body' ? 'flex' : 'block';
                if (arrow) arrow.classList.remove('collapsed');
            } else {
                body.style.display = 'none';
                if (arrow) arrow.classList.add('collapsed');
            }
        }

        const providerModes = {
            'heros-baymax': [
                { value: 'text', label: 'Standard Text Chat' },
                { value: 'coding', label: 'Coding Specialist' },
                { value: 'websearch', label: 'Live Web Search' },
                { value: 'voice', label: 'Voice / Concise' }
            ],
            'heros-infinsight': [
                { value: 'text', label: 'Standard Text Chat' }
            ],
            'heros-halo': [
                { value: 'text', label: 'Standard Text Chat' },
                { value: 'coding', label: 'Coding Specialist' },
                { value: 'websearch', label: 'Live Web Search' },
                { value: 'voice', label: 'Voice / Concise' }
            ],
            'heros-zeno': [
                { value: 'zeno_eco', label: 'Zeno Eco' },
                { value: 'zeno_plus', label: 'Zeno Plus' },
                { value: 'voice', label: 'Zeno Voice' }
            ],
            'custom-gemini': [
                { value: 'text', label: 'Standard Text Chat' },
                { value: 'coding', label: 'Coding Specialist' },
                { value: 'websearch', label: 'Live Web Search' },
                { value: 'voice', label: 'Voice / Concise' }
            ],
            'custom-groq': [
                { value: 'text', label: 'Standard Text Chat' },
                { value: 'coding', label: 'Coding Specialist' },
                { value: 'websearch', label: 'Live Web Search' },
                { value: 'voice', label: 'Voice / Concise' }
            ],
            'custom-openrouter': [
                { value: 'text', label: 'Standard Text Chat' },
                { value: 'coding', label: 'Coding Specialist' },
                { value: 'websearch', label: 'Live Web Search' },
                { value: 'voice', label: 'Voice / Concise' }
            ]
        };

        function handleProviderChange() {
            const provider = document.getElementById('dev-provider').value;
            const selectWrapper = document.getElementById('dev-model-select-wrapper');
            const selectEl = document.getElementById('dev-model-select');
            const inputWrapper = document.getElementById('dev-model-input-wrapper');
            const taskModeSelect = document.getElementById('dev-task-mode');
            const fastWrapper = document.getElementById('dev-fast-mode-wrapper');

            if (provider.startsWith('custom-')) {
                selectWrapper.style.display = 'flex';
                selectEl.innerHTML = '';
                if (providerModels[provider]) {
                    providerModels[provider].forEach(opt => {
                        selectEl.innerHTML += `<option value="${opt.value}">${opt.label}</option>`;
                    });
                }
                inputWrapper.style.display = selectEl.value === 'custom' ? 'flex' : 'none';
            } else {
                selectWrapper.style.display = 'none';
                inputWrapper.style.display = 'none';
            }

            if (providerModes[provider]) {
                taskModeSelect.innerHTML = '';
                providerModes[provider].forEach(opt => {
                    taskModeSelect.innerHTML += `<option value="${opt.value}">${opt.label}</option>`;
                });
            }

            if (provider === 'heros-baymax' || provider === 'custom-groq') {
                fastWrapper.style.display = 'flex';
            } else {
                fastWrapper.style.display = 'none';
            }

            if (typeof updateCompareModelLabels === 'function') {
                updateCompareModelLabels();
            }
        }

        function handleModelSelectChange() {
            const selectEl = document.getElementById('dev-model-select');
            const inputWrapper = document.getElementById('dev-model-input-wrapper');
            inputWrapper.style.display = selectEl.value === 'custom' ? 'flex' : 'none';
            if (typeof updateCompareModelLabels === 'function') {
                updateCompareModelLabels();
            }
        }

        let playgroundHistory = [];
        let selectedFilesPayload = [];

        function formatMarkdown(text) {
            if (!text) return '';
            let html = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // Code blocks
            html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
                return `<pre class="pg-code"><code>${code}</code></pre>`;
            });
            // Inline code
            html = html.replace(/`([^`]+)`/g, '<code class="pg-inline-code">$1</code>');
            // Bold
            html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            // Italics
            html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
            // Line breaks
            html = html.replace(/\n/g, '<br>');
            return html;
        }

        // Model Config Helper
        function getModelConfig(providerSelection, isModelB = false) {
            const taskMode = document.getElementById('dev-task-mode').value;
            const isFastEl = document.getElementById('dev-fast-mode');
            const isFast = isFastEl ? (isFastEl.value === 'fast') : false;

            let modelName = '';
            let isDeveloper = false;
            let devProvider = '';
            let finalModel = 'Baymax';
            let chatMode = taskMode;

            if (providerSelection === 'heros-baymax') {
                finalModel = 'Baymax';
                chatMode = taskMode;
                isDeveloper = false;
            } else if (providerSelection === 'heros-infinsight') {
                finalModel = 'infinsight';
                chatMode = 'text';
                isDeveloper = false;
            } else if (providerSelection === 'heros-halo') {
                finalModel = 'Halo';
                chatMode = taskMode;
                isDeveloper = false;
            } else if (providerSelection === 'heros-zeno') {
                finalModel = 'Zeno';
                chatMode = taskMode;
                isDeveloper = false;
            } else if (providerSelection.startsWith('custom-')) {
                isDeveloper = true;
                devProvider = providerSelection.replace('custom-', '');
                chatMode = taskMode;

                if (!isModelB) {
                    const selectVal = document.getElementById('dev-model-select').value;
                    if (selectVal === 'custom') {
                        modelName = document.getElementById('dev-model-input').value.trim();
                    } else {
                        modelName = selectVal;
                    }
                }
                if (!modelName) {
                    if (devProvider === 'gemini') modelName = 'gemini-3.6-flash';
                    else if (devProvider === 'groq') modelName = 'allam-2-7b';
                    else if (devProvider === 'openrouter') modelName = 'nvidia/nemotron-3-super-120b-a12b:free';
                }
            }

            let modelLabel = isDeveloper ? modelName : providerSelection.replace('heros-', '').toUpperCase();
            if (providerSelection === 'heros-baymax') modelLabel = 'Baymax-4.5';
            return { finalModel, chatMode, isDeveloper, devProvider, modelName, isFast, modelLabel };
        }

        async function fetchAndRenderModelResponse(targetBoxId, modelLabel, payload) {
            const chatBox = document.getElementById(targetBoxId);
            if (!chatBox) return;

            const loadingId = 'loading-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
            chatBox.innerHTML += `
                <div id="${loadingId}" class="pg-msg-row assistant">
                    <div class="pg-msg-meta">${modelLabel} • Generating...</div>
                    <div class="pg-msg-bubble pg-thinking">
                        Thinking...
                    </div>
                </div>
            `;
            chatBox.scrollTop = chatBox.scrollHeight;

            const startTime = performance.now();

            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.remove();

                if (data.status === 'success') {
                    if (data.session_id) chatSessionId = data.session_id;
                    const replyText = data.reply || '';
                    playgroundHistory.push({ role: 'assistant', content: replyText });

                    const assistantHtml = `
                        <div class="pg-msg-row assistant">
                            <div class="pg-msg-meta">
                                <span class="pg-model-label">${modelLabel}</span>
                                <span>•</span>
                                <span class="text-success"><i class="fa-solid fa-bolt"></i> ${data.time_taken || elapsed}s</span>
                            </div>
                            <div class="pg-msg-bubble">${formatMarkdown(replyText)}</div>
                        </div>
                    `;
                    chatBox.innerHTML += assistantHtml;
                } else {
                    const errorMsg = data.error || data.message || 'Error generating response';
                    chatBox.innerHTML += `
                        <div class="pg-msg-row assistant">
                            <div class="pg-msg-meta" style="color:var(--danger);">${modelLabel} • Error</div>
                            <div class="pg-msg-bubble" style="border-color:rgba(239,68,68,0.3); ">${errorMsg}</div>
                        </div>
                    `;
                }
            } catch (e) {
                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.remove();

                chatBox.innerHTML += `
                    <div class="pg-msg-row assistant">
                        <div class="pg-msg-meta" style="color:var(--danger);">${modelLabel} • Network Error</div>
                        <div class="pg-msg-bubble" style="border-color:rgba(239,68,68,0.3); ">Failed to reach Heros server.</div>
                    </div>
                `;
            }
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        async function sendPlaygroundMessage() {
            const inputEl = document.getElementById('chat-input');
            const msg = inputEl.value.trim();
            if (!msg && selectedFilesPayload.length === 0) return;

            // Hide empty states
            const emptyState = document.getElementById('pg-empty-state');
            if (emptyState) emptyState.style.display = 'none';

            const systemPrompt = document.getElementById('pg-system-prompt').value.trim();
            const providerSelection = document.getElementById('dev-provider').value;
            const tempVal = parseFloat(document.getElementById('dev-temperature').value);
            const tokensVal = parseInt(document.getElementById('dev-max-tokens').value);

            const cfgA = getModelConfig(providerSelection, false);

            const chatBox = document.getElementById('chat-box');

            // Append user message
            let fileNotice = selectedFilesPayload.length > 0 ? `<div class="pg-file-note"><i class="fa-regular fa-file-lines"></i> ${selectedFilesPayload[0].name}</div>` : '';
            const userHtml = `
                <div class="pg-msg-row user">
                    <div class="pg-msg-meta">You</div>
                    <div class="pg-msg-bubble">${fileNotice}${formatMarkdown(msg || '[File uploaded]')}</div>
                </div>
            `;
            chatBox.innerHTML += userHtml;

            const filesCopy = [...selectedFilesPayload];

            inputEl.value = '';
            inputEl.style.height = 'auto';
            chatBox.scrollTop = chatBox.scrollHeight;

            // Push to history
            playgroundHistory.push({ role: 'user', content: msg || '[File uploaded]' });

            const payloadA = {
                message: msg,
                system_prompt: systemPrompt,
                model: cfgA.finalModel,
                mode: cfgA.chatMode,
                is_fast: cfgA.isFast,
                temperature: tempVal,
                max_tokens: tokensVal,
                session_id: chatSessionId,
                temporary_chat: true,
                is_developer: cfgA.isDeveloper,
                dev_provider: cfgA.devProvider,
                dev_model_name: cfgA.modelName,
                send_history: playgroundHistory.slice(-10),
                files: filesCopy
            };

            // Clear file attachment
            selectedFilesPayload = [];
            document.getElementById('pg-file-tag').style.display = 'none';

            if (isCompareMode) {
                const emptyState2 = document.getElementById('pg-empty-state-2');
                if (emptyState2) emptyState2.style.display = 'none';

                const chatBox2 = document.getElementById('chat-box-2');
                if (chatBox2) {
                    chatBox2.innerHTML += userHtml;
                    chatBox2.scrollTop = chatBox2.scrollHeight;
                }

                const providerSelB = document.getElementById('dev-provider-2').value;
                const cfgB = getModelConfig(providerSelB, true);

                const payloadB = {
                    message: msg,
                    system_prompt: systemPrompt,
                    model: cfgB.finalModel,
                    mode: cfgB.chatMode,
                    is_fast: cfgB.isFast,
                    temperature: tempVal,
                    max_tokens: tokensVal,
                    session_id: chatSessionId,
                    temporary_chat: true,
                    is_developer: cfgB.isDeveloper,
                    dev_provider: cfgB.devProvider,
                    dev_model_name: cfgB.modelName,
                    send_history: playgroundHistory.slice(-10),
                    files: filesCopy
                };

                await Promise.all([
                    fetchAndRenderModelResponse('chat-box', cfgA.modelLabel, payloadA),
                    fetchAndRenderModelResponse('chat-box-2', cfgB.modelLabel, payloadB)
                ]);
            } else {
                await fetchAndRenderModelResponse('chat-box', cfgA.modelLabel, payloadA);
            }
        }


        function handleChatKeydown(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendPlaygroundMessage();
            }
        }

        function clearPlaygroundChat() {
            playgroundHistory = [];
            const chatBox = document.getElementById('chat-box');
            chatBox.innerHTML = `
                <div id="pg-empty-state" class="pg-empty-state">
                    <div class="pg-empty-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <div class="pg-empty-text">Your conversation will appear here</div>
                </div>
            `;
        }

        function focusChatInput() {
            const input = document.getElementById('chat-input');
            if (input) input.focus();
        }

        function triggerFileUpload() {
            document.getElementById('pg-file-input').click();
        }

        function handleFileSelected(e) {
            const file = e.target.files[0];
            if (!file) return;
            const tag = document.getElementById('pg-file-tag');
            tag.innerText = ` ${file.name}`;
            tag.style.display = 'inline-flex';

            const reader = new FileReader();
            reader.onload = function(evt) {
                selectedFilesPayload = [{
                    name: file.name,
                    type: file.type,
                    content: evt.target.result
                }];
            };
            reader.readAsText(file);
        }

        let isCompareMode = false;

        function toggleCompareMode() {
            isCompareMode = !isCompareMode;
            const btn = document.getElementById('btn-compare-mode');
            const col1Header = document.getElementById('pg-col-header-1');
            const col2 = document.getElementById('pg-chat-col-2');

            if (isCompareMode) {
                if (btn) btn.classList.add('active');
                if (col1Header) col1Header.style.display = 'flex';
                if (col2) col2.style.display = 'flex';
                updateCompareModelLabels();
                customAlert('Model Comparison Mode Enabled! Select Model B in the second column to compare dual responses side-by-side.', 'Model Comparison', 'info');
            } else {
                if (btn) btn.classList.remove('active');
                if (col1Header) col1Header.style.display = 'none';
                if (col2) col2.style.display = 'none';
            }
        }

        function updateCompareModelLabels() {
            const providerSelection = document.getElementById('dev-provider').value;
            const labelEl = document.getElementById('compare-model-a-label');
            if (labelEl) {
                let name = providerSelection.replace('heros-', '').replace('custom-', '').toUpperCase();
                if (providerSelection === 'heros-baymax') name = 'Baymax-4.5';
                labelEl.innerText = name;
            }
        }

        function clearPlaygroundChat() {
            playgroundHistory = [];
            document.getElementById('chat-box').innerHTML = `
                <div id="pg-empty-state" class="pg-empty-state">
                    <div class="pg-empty-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <div class="pg-empty-text">Your conversation will appear here</div>
                </div>
            `;
            const box2 = document.getElementById('chat-box-2');
            if (box2) {
                box2.innerHTML = `
                    <div id="pg-empty-state-2" class="pg-empty-state">
                        <div class="pg-empty-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <div class="pg-empty-text">Model B response will appear here</div>
                    </div>
                `;
            }
        }

        // ---- Code Export Modal ----
        let currentCodeTab = 'python';

        function renderLinesToTable(tableId, rawCode, lang) {
            const tableEl = document.getElementById(tableId);
            if (!tableEl) return;
            const lines = rawCode.split('\n');
            let html = '';
            for (let i = 0; i < lines.length; i++) {
                let lineText = lines[i];
                let highlighted = escapeHtml(lineText);

                if (lang === 'python') {
                    highlighted = highlighted
                        .replace(/\b(from|import|def|class|return|True|False|None)\b/g, '<span class="syn-keyword">$1</span>')
                        .replace(/\b(OpenAI|client|requests)\b/g, '<span class="syn-func">$1</span>')
                        .replace(/(".*?"|'.*?')/g, '<span class="syn-string">$1</span>')
                        .replace(/(#.*$)/g, '<span class="syn-comment">$1</span>');
                } else if (lang === 'javascript' || lang === 'js') {
                    highlighted = highlighted
                        .replace(/\b(const|let|var|await|async|function|return|true|false)\b/g, '<span class="syn-keyword">$1</span>')
                        .replace(/\b(fetch|JSON|console|log)\b/g, '<span class="syn-func">$1</span>')
                        .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="syn-string">$1</span>')
                        .replace(/(\/\/.*$)/g, '<span class="syn-comment">$1</span>');
                } else if (lang === 'curl') {
                    highlighted = highlighted
                        .replace(/\b(curl|POST|GET)\b/g, '<span class="syn-keyword">$1</span>')
                        .replace(/(-X|-H|-d|--data)/g, '<span class="syn-func">$1</span>')
                        .replace(/(".*?"|'.*?')/g, '<span class="syn-string">$1</span>');
                }

                html += `<tr><td class="line-num">${i + 1}</td><td class="line-code">${highlighted || '&nbsp;'}</td></tr>`;
            }
            tableEl.innerHTML = html;
        }

        function openCodeExportModal() {
            const langSelect = document.getElementById('view-code-lang');
            if (langSelect) langSelect.value = 'python';
            switchCodeTab('python');
            document.getElementById('code-modal-overlay').classList.add('active');
        }

        function closeCodeExportModal() {
            document.getElementById('code-modal-overlay').classList.remove('active');
        }

        function switchCodeTab(lang) {
            currentCodeTab = lang;
            const langSelect = document.getElementById('view-code-lang');
            if (langSelect && langSelect.value !== lang) {
                langSelect.value = lang;
            }

            const endpointLabel = document.getElementById('view-code-endpoint-text');
            if (endpointLabel) {
                endpointLabel.textContent = '/v1/chat/completions';
            }

            const providerSelection = document.getElementById('dev-provider').value;
            const sysPrompt = document.getElementById('pg-system-prompt').value.trim() || 'You are a helpful AI assistant.';
            const taskMode = document.getElementById('dev-task-mode').value;
            const isFastEl = document.getElementById('dev-fast-mode');
            const isFast = isFastEl ? (isFastEl.value === 'fast') : false;
            const tempVal = parseFloat(document.getElementById('dev-temperature').value) || 0.7;
            const tokensVal = parseInt(document.getElementById('dev-max-tokens').value) || 2048;

            let finalModel = 'baymax-4.5';
            let devProvider = '';
            let isDeveloper = false;
            let devModelName = '';

            if (providerSelection.startsWith('custom-')) {
                isDeveloper = true;
                devProvider = providerSelection.replace('custom-', '');
                const selectVal = document.getElementById('dev-model-select').value;
                devModelName = selectVal === 'custom' ? (document.getElementById('dev-model-input').value || 'custom-model') : selectVal;
                finalModel = devModelName;
            } else {
                finalModel = providerSelection.replace('heros-', '');
            }

            const sampleMsg = "Hello, what can you do for me today?";
            const codeBox = document.getElementById('code-snippet-box');
            let rawCode = '';

            if (lang === 'python') {
                rawCode = `from openai import OpenAI

client = OpenAI(
    base_url="${window.location.origin}/api/v1",
    api_key="sk-hero-YOUR_API_KEY"
)

stream = client.chat.completions.create(
    model="${finalModel}",
    messages=[
        {"role": "system", "content": "${sysPrompt.replace(/"/g, '\\"')}"},
        {"role": "user", "content": "${sampleMsg}"}
    ],
    temperature=${tempVal},
    max_tokens=${tokensVal},
    stream=True,
    extra_body={
        "mode": "${taskMode}",
        "is_fast": ${isFast ? 'True' : 'False'}
    }
)

for chunk in stream:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)`;
            } else if (lang === 'javascript' || lang === 'js') {
                rawCode = `const response = await fetch("${window.location.origin}/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk-hero-YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "${finalModel}",
    messages: [
      { role: "system", content: "${sysPrompt.replace(/"/g, '\\"')}" },
      { role: "user", content: "${sampleMsg}" }
    ],
    temperature: ${tempVal},
    max_tokens: ${tokensVal},
    extra_body: {
      mode: "${taskMode}",
      is_fast: ${isFast}
    }
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`;
            } else if (lang === 'curl') {
                rawCode = `curl -X POST "${window.location.origin}/api/v1/chat/completions" \\
  -H "Authorization: Bearer sk-hero-YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${finalModel}",
    "messages": [
      {"role": "system", "content": "${sysPrompt.replace(/'/g, "\\'")}"},
      {"role": "user", "content": "${sampleMsg}"}
    ],
    "temperature": ${tempVal},
    "max_tokens": ${tokensVal},
    "extra_body": {
      "mode": "${taskMode}",
      "is_fast": ${isFast}
    }
  }'`;
            }

            if (codeBox) codeBox.innerText = rawCode;
            renderLinesToTable('view-code-table', rawCode, lang);
        }

        function copyCodeSnippet() {
            const text = document.getElementById('code-snippet-box').innerText;
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.getElementById('btn-copy-code');
                if (btn) {
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-check" style="color:#22c55e;"></i>';
                    setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
                }
            });
        }

        // Developer Docs Multi-Language Switching
        function switchDocSnippet(containerId, lang) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.setAttribute('data-active-lang', lang);
            const pres = container.querySelectorAll('.doc-code-pre');
            pres.forEach(pre => {
                if (pre.getAttribute('data-lang') === lang) {
                    pre.style.display = 'block';
                } else {
                    pre.style.display = 'none';
                }
            });
        }

        function copySnippetBox(containerId, btn) {
            const container = document.getElementById(containerId);
            if (!container) return;
            const activeLang = container.getAttribute('data-active-lang') || 'python';
            const activePre = container.querySelector(`.doc-code-pre[data-lang="${activeLang}"]`);
            if (!activePre) return;
            navigator.clipboard.writeText(activePre.innerText).then(() => {
                if (btn) {
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-check" style="color:#22c55e;"></i>';
                    setTimeout(() => { btn.innerHTML = originalHtml; }, 1800);
                }
            });
        }

        // ---- Templates Modal ----
        function openTemplatesModal() {
            document.getElementById('templates-modal-overlay').classList.add('active');
        }

        function closeTemplatesModal() {
            document.getElementById('templates-modal-overlay').classList.remove('active');
        }

        function applyPromptTemplate(type) {
            const sysBox = document.getElementById('pg-system-prompt');
            if (type === 'software_architect') {
                sysBox.value = "You are an expert software architect. Provide clean, robust, production-ready code with concise step-by-step explanations.";
            } else if (type === 'web_researcher') {
                sysBox.value = "You are a real-time web research assistant. Synthesize current facts, structure key points logically, and provide clear takeaways.";
            } else if (type === 'json_api') {
                sysBox.value = "You are a data extraction bot. Respond ONLY with valid JSON matching the requested structure. Do not include markdown code block formatting or intro text.";
            } else if (type === 'concise_voice') {
                sysBox.value = "You are a voice assistant. Keep answers direct, friendly, and under 2 short sentences (max 30 words). Never use lists or markdown formatting.";
            }
            closeTemplatesModal();
        }

        function generateSamplePrompt() {
            const sysBox = document.getElementById('pg-system-prompt');
            const samples = [
                "Be concise, direct, and objective. Avoid introductory greetings or pleasantries.",
                "You are an expert developer assistant. Explain concepts clearly and output clean, well-commented code.",
                "Act as a professional technical editor. Critique draft text for clarity, grammar, and punchy flow."
            ];
            const current = sysBox.value;
            let nextIdx = 0;
            if (current) {
                nextIdx = (samples.indexOf(current) + 1) % samples.length;
                if (nextIdx < 0) nextIdx = 0;
            }
            sysBox.value = samples[nextIdx];
        }

        // --- Account & Profile Sub-Tab Navigation ---
        function switchAccountSubTab(subTabId) {
            ['profile', 'team'].forEach(id => {
                const panel = document.getElementById(`account-panel-${id}`);
                if (panel) panel.style.display = 'none';
                const tab = document.getElementById(`account-tab-${id}`);
                if (tab) tab.classList.remove('active');
            });

            const activePanel = document.getElementById(`account-panel-${subTabId}`);
            if (activePanel) activePanel.style.display = 'block';

            const activeTab = document.getElementById(`account-tab-${subTabId}`);
            if (activeTab) activeTab.classList.add('active');
        }

        // --- Settings Sub-Tab Navigation & Logic ---
        function switchSettingsSubTab(subTabId) {
            ['notifications', 'security', 'danger'].forEach(id => {
                const panel = document.getElementById(`sett-panel-${id}`);
                if (panel) panel.style.display = 'none';
                const tab = document.getElementById(`sett-tab-${id}`);
                if (tab) tab.classList.remove('active');
            });

            const activePanel = document.getElementById(`sett-panel-${subTabId}`);
            if (activePanel) activePanel.style.display = 'block';

            const activeTab = document.getElementById(`sett-tab-${subTabId}`);
            if (activeTab) activeTab.classList.add('active');
        }

        // --- Terms & Policies Sub-Tab Navigation ---
        function switchTermsSubTab(subTabId) {
            ['tos', 'privacy', 'cookies', 'aup'].forEach(id => {
                const panel = document.getElementById(`terms-panel-${id}`);
                if (panel) panel.style.display = 'none';
                const tab = document.getElementById(`terms-tab-${id}`);
                if (tab) tab.classList.remove('active');
            });

            const activePanel = document.getElementById(`terms-panel-${subTabId}`);
            if (activePanel) activePanel.style.display = 'block';

            const activeTab = document.getElementById(`terms-tab-${subTabId}`);
            if (activeTab) activeTab.classList.add('active');
        }

        async function saveSettingsAccount() {
            const name = document.getElementById('sett-account-name').value;
            const org = document.getElementById('sett-account-org').value;
            const role = document.getElementById('sett-account-role').value;

            if (!name || name.trim() === '') {
                customAlert('Please enter your full name.', 'Validation Error', 'error');
                return;
            }

            try {
                const res = await fetch('/api/user/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
                    body: JSON.stringify({ name: name, company_name: org, user_role: role })
                });
                const data = await res.json();
                if (res.ok && data.status === 'success') {
                    customAlert('Developer profile, organization, and primary role updated successfully.', 'Profile Saved', 'success');
                } else {
                    customAlert(data.message || 'Failed to update profile settings.', 'Error', 'error');
                }
            } catch (err) {
                customAlert('Network error occurred while saving profile settings.', 'Connection Error', 'error');
            }
        }

        function saveSettingsBilling() {
            const limit = document.getElementById('sett-billing-limit').value;
            const alertPct = document.getElementById('sett-billing-alert').value;
            customAlert(`Billing limits updated: Monthly cap set to $${limit} with alert threshold at ${alertPct}%.`, 'Billing Updated', 'success');
        }

        function inviteTeamMember() {
            customAlert('Team invitations & role-based access control are available on Heros Enterprise plans. Contact support to enable organization seats.', 'Invite Member');
        }

        async function saveSettingsNotifications() {
            const usage = document.getElementById('sett-notif-usage') ? document.getElementById('sett-notif-usage').checked : true;
            const quota = document.getElementById('sett-notif-quota') ? document.getElementById('sett-notif-quota').checked : true;
            const updates = document.getElementById('sett-notif-updates') ? document.getElementById('sett-notif-updates').checked : true;

            try {
                const res = await fetch('/api/user/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
                    body: JSON.stringify({
                        notify_daily_usage: usage,
                        notify_quota_alerts: quota,
                        notify_product_updates: updates
                    })
                });
                const data = await res.json();
                if (res.ok && data.status === 'success') {
                    customAlert('Email notification preferences saved successfully.', 'Preferences Saved', 'success');
                } else {
                    customAlert(data.message || 'Failed to update notification settings.', 'Error', 'error');
                }
            } catch (err) {
                customAlert('Network error occurred while saving notification settings.', 'Connection Error', 'error');
            }
        }

        function toggleFaq(faqId) {
            const el = document.getElementById(faqId);
            const icon = document.getElementById(faqId + '-icon');
            if (!el) return;
            if (el.style.display === 'none' || !el.style.display) {
                el.style.display = 'block';
                if (icon) icon.style.transform = 'rotate(180deg)';
            } else {
                el.style.display = 'none';
                if (icon) icon.style.transform = 'rotate(0deg)';
            }
        }

        async function sendHelpEmail() {
            const catEl = document.getElementById('help-category');
            const subjEl = document.getElementById('help-subject');
            const msgEl = document.getElementById('help-message');

            const category = catEl ? catEl.value : 'General Support';
            const rawSubject = subjEl ? subjEl.value.trim() : '';
            const message = msgEl ? msgEl.value.trim() : '';

            if (!message) {
                customAlert('Please write a message before sending your support request.', 'Help & Support', 'warning');
                return;
            }

            const subject = rawSubject ? `[${category}] ${rawSubject}` : `[${category}] Support Inquiry`;

            try {
                const res = await fetch('/api/platform/help/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
                    body: JSON.stringify({ subject: subject, message: message })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    customAlert(data.message || 'Support email submitted successfully!', 'Support Sent', 'success');
                    if (subjEl) subjEl.value = '';
                    if (msgEl) msgEl.value = '';
                } else {
                    customAlert(data.error || 'Failed to send support email.', 'Error', 'error');
                }
            } catch (err) {
                customAlert('Network error while sending support email.', 'Connection Error', 'error');
            }
        }

        async function updateSettingsPassword() {
            const curr = document.getElementById('sett-sec-curr-pass').value;
            const newP = document.getElementById('sett-sec-new-pass').value;
            const confP = document.getElementById('sett-sec-confirm-pass').value;

            if (!curr) {
                customAlert('Please enter your current password.', 'Password Error', 'error');
                return;
            }
            if (!newP || newP.length < 8) {
                customAlert('New password must be at least 8 characters long.', 'Password Error', 'error');
                return;
            }
            if (newP !== confP) {
                customAlert('New password and confirmation do not match.', 'Password Error', 'error');
                return;
            }

            try {
                const res = await fetch('/api/user/password/change', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
                    body: JSON.stringify({ current_password: curr, new_password: newP, confirm_password: confP })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    document.getElementById('sett-sec-curr-pass').value = '';
                    document.getElementById('sett-sec-new-pass').value = '';
                    document.getElementById('sett-sec-confirm-pass').value = '';
                    customAlert(data.message || 'Password updated successfully.', 'Security', 'success');
                } else {
                    customAlert(data.error || 'Failed to update password.', 'Password Error', 'error');
                }
            } catch (err) {
                customAlert('Network error occurred while updating password.', 'Connection Error', 'error');
            }
        }

        async function purgeSettingsLogs() {
            const confirmed = await customConfirm('Are you sure you want to purge all historical API request logs and metrics? This cannot be undone.', 'Purge Request Logs', 'Purge All Logs', 'danger');
            if (!confirmed) {
                return;
            }
            try {
                const res = await fetch('/api/user/danger/purge-logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken }
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    customAlert(data.message || 'Logs purged successfully.', 'Purge Logs', 'success');
                } else {
                    customAlert(data.error || 'Failed to purge logs.', 'Purge Error', 'error');
                }
            } catch (err) {
                customAlert('Network error occurred while purging logs.', 'Connection Error', 'error');
            }
        }

        async function deleteDeveloperAccount() {
            const confirmed = await customConfirm('<i class="fa-solid fa-triangle-exclamation"></i> WARNING: Are you absolutely sure you want to PERMANENTLY DELETE your developer account, all API keys, and metrics? This action is PERMANENT and IRREVERSIBLE.', 'Delete Account', 'Permanently Delete Account', 'danger');
            if (!confirmed) {
                return;
            }
            try {
                const res = await fetch('/api/user/danger/delete-account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken }
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    await customAlert(data.message || 'Account permanently deleted.', 'Account Deleted', 'success');
                    window.location.href = data.redirect_url || '/';
                } else {
                    customAlert(data.error || 'Failed to delete developer account.', 'Account Deletion Error', 'error');
                }
            } catch (err) {
                customAlert('Network error occurred during account deletion.', 'Connection Error', 'error');
            }
        }

        async function inviteTeamMember() {
            const email = await customPrompt("Enter team member's email address:");
            if (email && email.trim() !== '') {
                customAlert(`Invitation link sent to ${email.trim()}.`, 'Invite Sent', 'success');
            }
        }

        function saveSettingsNotifications() {
            customAlert('Notification & email alert preferences saved successfully.', 'Preferences Saved', 'success');
        }

        document.addEventListener('DOMContentLoaded', () => {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab) {
                switchTab(tab);
            }

            // Close popover when clicking outside
            document.addEventListener('click', (e) => {
                const popover = document.getElementById('userPopover');
                if (popover && popover.classList.contains('show') && !e.target.closest('.sidebar-user-pill')) {
                    popover.classList.remove('show');
                }
            });
        });

/* ════════ v6 additions ════════ */

// The command palette's "Create Secret API Key" action called a function that never existed.
function openGenerateKeyModal() { return openKeyModal(); }

// Mobile navigation drawer
function togglePlatformNav(force) {
    const open = typeof force === 'boolean' ? force : !document.body.classList.contains('pf-nav-open');
    document.body.classList.toggle('pf-nav-open', open);
}

document.addEventListener('click', (e) => {
    const pop = document.getElementById('projectPopover');
    if (pop && pop.classList.contains('show') && !e.target.closest('.sidebar-project-selector')) pop.classList.remove('show');
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    ['key-modal-overlay', 'code-modal-overlay', 'templates-modal-overlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.classList.contains('active')) el.classList.remove('active');
    });
    togglePlatformNav(false);
});

document.addEventListener('DOMContentLoaded', () => {
    const search = document.querySelector('.sidebar-search');
    search?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlatformSearch(); } });
    const keyOverlay = document.getElementById('key-modal-overlay');
    keyOverlay?.addEventListener('click', (e) => { if (e.target === keyOverlay) closeKeyModal(); });
    // Load usage once so the Home status card shows live latency
    if (typeof loadUsage === 'function') setTimeout(() => loadUsage(false), 400);
});
