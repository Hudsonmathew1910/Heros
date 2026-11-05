/* ══════════════════════════════════════════════════════════════
   Heros Shell — theme, sidebar, menus, model picker, greetings.
   Shared by every page. Exposes window.HerosTheme / window.HerosShell.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Theme ───────────────────────────────────────────────── */
  var THEME_KEY = 'hero-theme';
  function storedTheme() { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } }
  function systemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  var HerosTheme = {
    get: function () { return document.documentElement.getAttribute('data-theme') || storedTheme() || systemTheme(); },
    set: function (theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
      document.dispatchEvent(new CustomEvent('heros:theme', { detail: theme }));
    },
    toggle: function () { HerosTheme.set(HerosTheme.get() === 'dark' ? 'light' : 'dark'); },
    initial: function () { return storedTheme() || systemTheme(); }
  };
  if (!document.documentElement.getAttribute('data-theme')) {
    document.documentElement.setAttribute('data-theme', HerosTheme.initial());
  }
  window.HerosTheme = HerosTheme;

  /* ── Sidebar (desktop: collapse to rail · mobile: drawer) ── */
  var COLLAPSE_KEY = 'hero-sidebar-collapsed';
  function isMobile() { return window.matchMedia('(max-width: 900px)').matches; }

  function applyCollapsedState() {
    var collapsed = false;
    try { collapsed = localStorage.getItem(COLLAPSE_KEY) === '1'; } catch (e) {}
    document.body.classList.toggle('sidebar-collapsed', !isMobile() && collapsed);
  }

  function setMobileOpen(open) {
    var sb = document.getElementById('sidebar');
    var bd = document.getElementById('sidebarBackdrop');
    if (sb) sb.classList.toggle('open', open);
    if (bd) bd.classList.toggle('visible', open);
    document.body.classList.toggle('sidebar-open', open);
  }

  function toggleSidebar() {
    if (isMobile()) {
      var sb = document.getElementById('sidebar');
      setMobileOpen(!(sb && sb.classList.contains('open')));
      return;
    }
    var collapsed = !document.body.classList.contains('sidebar-collapsed');
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch (e) {}
  }

  /* ── Generic menus: [data-menu="menuId"] toggles #menuId.open ── */
  function closeMenus(except) {
    document.querySelectorAll('.menu.open[data-autoclose]').forEach(function (m) {
      if (m !== except) m.classList.remove('open');
    });
    document.querySelectorAll('[data-menu][aria-expanded="true"]').forEach(function (t) {
      if (!except || t.getAttribute('data-menu') !== except.id) t.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-menu]');
    if (trigger) {
      var menu = document.getElementById(trigger.getAttribute('data-menu'));
      if (menu) {
        e.preventDefault();
        var willOpen = !menu.classList.contains('open');
        closeMenus(menu);
        if (willOpen && typeof menu._heroBeforeOpen === 'function') menu._heroBeforeOpen();
        menu.classList.toggle('open', willOpen);
        trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        return;
      }
    }
    var insideMenu = e.target.closest('.menu[data-autoclose]');
    if (insideMenu && !e.target.closest('[data-menu-close]')) {
      if (!e.target.closest('.menu-item, .menu-link, .mp-option')) return;
    }
    closeMenus(null);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMenus(null);
      if (isMobile()) setMobileOpen(false);
    }
  });

  /* ── Model picker (drives the hidden #modelSelect) ─────────── */
  var MODEL_META = {
    Baymax: { icon: 'fa-solid fa-robot', desc: 'Our smartest model · web search, files & code' },
    Halo: { icon: 'fa-solid fa-circle-nodes', desc: 'Fast everyday assistant · no sign-in needed' },
    ZORVIN: { icon: 'fa-solid fa-desktop', desc: 'Offline desktop model · in development' },
    Developer: { icon: 'fa-solid fa-code', desc: 'Bring your own provider & model' }
  };

  var ZENO_URL = 'https://github.com/Hudsonmathew1910/Hero-s-AI/releases/download/Heros_5th_Gen/Zeno_Pro_3.5.zip';

  function syncModelPicker() {
    var select = document.getElementById('modelSelect');
    var label = document.getElementById('modelPickerName');
    if (!select || !label) return;
    var opt = select.options[select.selectedIndex];
    label.textContent = opt ? opt.text : 'Heros';
  }

  function renderModelMenu() {
    var select = document.getElementById('modelSelect');
    var menu = document.getElementById('modelMenu');
    if (!select || !menu) return;
    var html = '<div class="menu-label">Models</div>';
    Array.prototype.forEach.call(select.options, function (opt) {
      var meta = MODEL_META[opt.value] || { icon: 'fa-solid fa-microchip', desc: '' };
      var selected = opt.value === select.value;
      html += '<button type="button" class="mp-option' + (selected ? ' selected' : '') + '"' +
        (opt.disabled ? ' disabled title="Sign in to use this model"' : '') +
        ' data-value="' + opt.value + '">' +
        '<span class="mp-icon"><i class="' + meta.icon + '"></i></span>' +
        '<span class="mp-text"><span class="mp-title">' + opt.text +
        (opt.disabled ? ' <span class="badge">Sign in</span>' : '') + '</span>' +
        '<span class="mp-desc">' + meta.desc + '</span></span>' +
        '<i class="fa-solid fa-check mp-check"></i></button>';
    });
    html += '<div class="menu-sep"></div>' +
      '<a class="mp-option mp-download" href="' + ZENO_URL + '" target="_blank" rel="noopener" download>' +
      '<span class="mp-icon"><i class="fa-brands fa-chrome"></i></span>' +
      '<span class="mp-text"><span class="mp-title">Download Zeno Pro 3.5</span>' +
      '<span class="mp-desc">Heros in your browser · Chrome &amp; Edge extension</span></span>' +
      '<i class="fa-solid fa-download mp-dl"></i></a>';
    menu.innerHTML = html;
  }

  function initModelPicker() {
    var select = document.getElementById('modelSelect');
    var menu = document.getElementById('modelMenu');
    if (!select || !menu) return;
    menu._heroBeforeOpen = renderModelMenu;
    menu.addEventListener('click', function (e) {
      var btn = e.target.closest('.mp-option');
      if (!btn || btn.disabled) return;
      var value = btn.getAttribute('data-value');
      if (!value) return; /* e.g. the Zeno download link */
      if (select.value !== value) {
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      syncModelPicker();
    });
    select.addEventListener('change', function () { setTimeout(syncModelPicker, 0); });
    syncModelPicker();
  }

  /* ── Time-aware greeting: [data-greeting] ──────────────────── */
  function initGreeting() {
    document.querySelectorAll('[data-greeting]').forEach(function (el) {
      var h = new Date().getHours();
      var part = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
      var name = (el.getAttribute('data-greeting') || '').trim();
      el.textContent = name ? part + ', ' + name.split(' ')[0] : part;
    });
  }

  /* ── Auto theme-toggle buttons: [data-theme-toggle] ───────── */
  function initThemeButtons() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      if (btn.getAttribute('onclick')) return;
      btn.addEventListener('click', function () { HerosTheme.toggle(); });
    });
  }

  window.HerosShell = {
    toggleSidebar: toggleSidebar,
    closeMobileSidebar: function () { if (isMobile()) setMobileOpen(false); },
    openMobileSidebar: function () { if (isMobile()) setMobileOpen(true); },
    isMobile: isMobile,
    closeMenus: function () { closeMenus(null); },
    syncModelPicker: syncModelPicker,
    renderModelMenu: renderModelMenu
  };

  function init() {
    applyCollapsedState();
    initModelPicker();
    initGreeting();
    initThemeButtons();
    document.body.classList.add('shell-ready');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  var lastMobile = null;
  window.addEventListener('resize', function () {
    var m = isMobile();
    if (m !== lastMobile) {
      lastMobile = m;
      if (!m) setMobileOpen(false);
      applyCollapsedState();
    }
  });
})();
