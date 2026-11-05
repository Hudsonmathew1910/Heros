/* ══════════════════════════════════════════════════════════════
   Heros — landing.js (v6; moved out of the v5 landing template)
   API-key modal, login modal, "fails gracefully" modal, Baymax routing
   simulator, scroll reveal + stat counters, product tabs, FAQ accordion.
   ══════════════════════════════════════════════════════════════ */
   (function () {
     "use strict";

     /* ---------- CSRF TOKEN HELPERS ---------- */
     function getCSRFToken() {
       const match = document.cookie.match(
         /(?:^|;) ?csrftoken=([^;]*)(?:;|$)/,
       );
       if (match) return match[1];
      var inp = document.querySelector('input[name="csrfmiddlewaretoken"]');
      return inp ? inp.value : "";
    }

    /* ---------- API KEY MODAL ---------- */
     var overlay = document.getElementById("keysOverlay");
     var openers = [
       document.getElementById("openKeysBtn"),
       document.getElementById("ctaKeys"),
     ];
     var closeBtn = document.getElementById("closeKeysBtn");
     var cancelBtn = document.getElementById("cancelKeysBtn");
     var saveBtn = document.getElementById("saveKeysBtn");
     var toast = document.getElementById("saveToast");
     var toastText = document.getElementById("toastText");
     var toastIcon = document.getElementById("toastIcon");
     var lastFocused = null;

     function openModal() {
       lastFocused = document.activeElement;

       // Check existing keys if logged in
       fetch("/api/keys/check", { method: "GET", credentials: "include" })
         .then((r) => r.json())
         .then((data) => {
           if (data.status === "success") {
             var g = document.getElementById("geminiKey");
             var o = document.getElementById("openrouterKey");
             var gr = document.getElementById("groqKey");
             var h = document.getElementById("huggingfaceKey");
             if (g)
               g.placeholder = data.keys.gemini
                 ? "Modify your Gemini API key"
                 : "AIza••••••••••••••••••••";
             if (o)
               o.placeholder = data.keys.openrouter
                 ? "Modify your OpenRouter API key"
                 : "sk-or-v1-••••••••••••••••";
             if (gr)
               gr.placeholder = data.keys.groq
                 ? "Modify your Groq API key"
                 : "gsk_••••••••••••••••••••";
             if (h)
               h.placeholder = data.keys.huggingface
                 ? "Modify your Hugging Face API key"
                 : "hf_••••••••••••••••••••";
           }
         })
         .catch((e) => console.error(e));

       overlay.classList.add("open");
       document.body.style.overflow = "hidden";
       var firstInput = document.getElementById("geminiKey");
       if (firstInput)
         setTimeout(function () {
           firstInput.focus();
         }, 250);
     }
     function closeModal() {
       overlay.classList.remove("open");
       document.body.style.overflow = "";
       if (lastFocused) lastFocused.focus();
     }
     function showToast(msg, isError = false) {
       toastText.textContent = msg;
       if (isError) {
         toast.classList.add("error");
         toastIcon.className = "fa-solid fa-circle-exclamation";
       } else {
         toast.classList.remove("error");
         toastIcon.className = "fa-solid fa-circle-check";
       }
       toast.classList.add("show");
       setTimeout(function () {
         toast.classList.remove("show");
       }, 3000);
     }

     openers.forEach(function (btn) {
       if (btn) btn.addEventListener("click", openModal);
     });
     closeBtn.addEventListener("click", closeModal);
     cancelBtn.addEventListener("click", closeModal);
     overlay.addEventListener("click", function (e) {
       if (e.target === overlay) closeModal();
     });
     document.addEventListener("keydown", function (e) {
       if (e.key === "Escape" && overlay.classList.contains("open"))
         closeModal();
       if (e.key === "Escape" && gracefulOverlay.classList.contains("open"))
         closeGracefulModal();
     });

     /* ---------- GRACEFUL POPUP MODAL ---------- */
     var gracefulOverlay = document.getElementById("gracefulOverlay");
     var gracefulBtn = document.getElementById("gracefulBtn");
     var closeGracefulBtn = document.getElementById("closeGracefulBtn");

     function openGracefulModal(e) {
       e.preventDefault();
       gracefulOverlay.classList.add("open");
       document.body.style.overflow = "hidden";
     }
     function closeGracefulModal() {
       gracefulOverlay.classList.remove("open");
       document.body.style.overflow = "";
     }

     if (gracefulBtn)
       gracefulBtn.addEventListener("click", openGracefulModal);
     if (closeGracefulBtn)
       closeGracefulBtn.addEventListener("click", closeGracefulModal);
     gracefulOverlay.addEventListener("click", function (e) {
       if (e.target === gracefulOverlay) closeGracefulModal();
     });

     /* ---------- LOGIN MODAL ---------- */
     var loginOverlay = document.getElementById("loginOverlay");
     var openLoginBtns = document.querySelectorAll(".open-login");
     var closeLoginBtn = document.getElementById("closeLoginBtn");
     var cancelLoginBtn = document.getElementById("cancelLoginBtn");
     var doLoginBtn = document.getElementById("doLoginBtn");

     function openLoginModal(e) {
       if (e) e.preventDefault();
       lastFocused = document.activeElement;
       if (loginOverlay) {
         loginOverlay.classList.add("open");
         document.body.style.overflow = "hidden";
         var firstInput = document.getElementById("landingLoginEmail");
         if (firstInput)
           setTimeout(function () {
             firstInput.focus();
           }, 250);
       }
     }
     function closeLoginModal() {
       if (loginOverlay) {
         loginOverlay.classList.remove("open");
         document.body.style.overflow = "";
         if (lastFocused) lastFocused.focus();
       }
     }

     if (openLoginBtns) {
       openLoginBtns.forEach(function (btn) {
         btn.addEventListener("click", openLoginModal);
       });
     }
     if (closeLoginBtn)
       closeLoginBtn.addEventListener("click", closeLoginModal);
     if (cancelLoginBtn)
       cancelLoginBtn.addEventListener("click", closeLoginModal);
     if (loginOverlay) {
       loginOverlay.addEventListener("click", function (e) {
         if (e.target === loginOverlay) closeLoginModal();
       });
     }

     document.addEventListener("keydown", function (e) {
       if (
         e.key === "Escape" &&
         loginOverlay &&
         loginOverlay.classList.contains("open")
       )
         closeLoginModal();
     });

     if (doLoginBtn) {
       doLoginBtn.addEventListener("click", function () {
         const email = document
           .getElementById("landingLoginEmail")
           .value.trim();
         const password = document.getElementById(
           "landingLoginPassword",
         ).value;

         if (!email || !password) {
           showToast("Please enter your email and password", true);
           return;
         }

         var btnContent = document.getElementById("doLoginContent");
         btnContent.innerHTML =
           '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
         doLoginBtn.style.pointerEvents = "none";

         fetch("/api/auth/login", {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
             "X-CSRFToken": getCSRFToken(),
           },
           body: JSON.stringify({ email, password }),
         })
           .then((r) => r.json())
           .then((data) => {
             if (data.status === "success") {
               showToast("Login successful!");
               setTimeout(() => {
                 window.location.href = "/";
               }, 600);
             } else {
               showToast(data.message || "Login failed", true);
             }
           })
           .catch(() => showToast("Network error", true))
           .finally(() => {
             btnContent.innerHTML =
               '<i class="fa-solid fa-right-to-bracket"></i> Login';
             doLoginBtn.style.pointerEvents = "";
           });
       });
     }

     /* show / hide key value */
     document.querySelectorAll(".toggle-vis").forEach(function (btn) {
       btn.addEventListener("click", function () {
         var target = document.getElementById(
           btn.getAttribute("data-target"),
         );
         var icon = btn.querySelector("i");
         if (target.type === "password") {
           target.type = "text";
           icon.classList.remove("fa-eye");
           icon.classList.add("fa-eye-slash");
         } else {
           target.type = "password";
           icon.classList.remove("fa-eye-slash");
           icon.classList.add("fa-eye");
         }
       });
     });

     saveBtn.addEventListener("click", function () {
       const gemini = document.getElementById("geminiKey").value.trim();
       const openrouter = document
         .getElementById("openrouterKey")
         .value.trim();
       const groq = document.getElementById("groqKey").value.trim();
       const huggingface = document.getElementById("huggingfaceKey") ? document.getElementById("huggingfaceKey").value.trim() : "";

       if (!gemini) {
         showToast("Gemini API key is required.", true);
         return;
       }

       var btnContent = document.getElementById("saveBtnContent");
       btnContent.innerHTML =
         '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
       saveBtn.style.pointerEvents = "none";

       fetch("/api/keys/save", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           "X-CSRFToken": getCSRFToken(),
         },
         credentials: "include",
         body: JSON.stringify({ gemini, openrouter, groq, huggingface }),
       })
         .then((r) => r.json())
         .then((data) => {
           if (data.status === "success") {
             showToast("API keys saved securely");
             setTimeout(closeModal, 600);
           } else {
             if (
               (data.message && data.message.includes("login")) ||
               data.detail
             ) {
               showToast("Please login first to save API keys", true);
             } else {
               showToast(data.message || "Failed to save keys", true);
             }
           }
         })
         .catch(() => showToast("Network error", true))
         .finally(() => {
           btnContent.innerHTML =
             '<i class="fa-solid fa-check"></i> Save keys';
           saveBtn.style.pointerEvents = "";
         });
     });

     /* ---------- HERO CHAIN DIAGRAM & SIMULATOR ---------- */
     var nodes = document.querySelectorAll("#chainDiagram .chain-node");
     var noteText = document.getElementById("chainNoteText");
     var providers = [
       {
         name: "Gemini",
         note: "Currently serving from Gemini. Context and chat history carry over untouched if a failover occurs.",
       },
       {
         name: "OpenRouter",
         note: "Gemini hit a rate limit — Baymax rerouted to OpenRouter mid-conversation without dropping context.",
       },
       {
         name: "Groq",
         note: "Falling back to Groq for low-latency inference while upstream providers recover.",
       },
     ];
     var current = 0;
     var isSimulating = false;
     var cycleInterval = null;

     function reducedMotion() {
       return (
         window.matchMedia &&
         window.matchMedia("(prefers-reduced-motion: reduce)").matches
       );
     }

     function cycle() {
       if (reducedMotion() || isSimulating) return;
       nodes.forEach(function (n) {
         n.classList.remove("active");
       });
       current = (current + 1) % nodes.length;
       nodes[current].classList.add("active");
       if (noteText) noteText.textContent = providers[current].note;
     }

     function startCycle() {
       if (cycleInterval) clearInterval(cycleInterval);
       if (!reducedMotion()) {
         cycleInterval = setInterval(cycle, 4200);
       }
     }
     startCycle();

     // Simulator Logic
     var simConsole = document.getElementById("simConsole");
     var btnSimGemini = document.getElementById("btnSimGemini");
     var btnSimRouter = document.getElementById("btnSimRouter");
     var btnSimReset = document.getElementById("btnSimReset");

     function addLog(msg, type) {
       if (!simConsole) return;
       var div = document.createElement("div");
       div.className = "log-line " + (type || "");
       var time = new Date().toLocaleTimeString();
       div.textContent = "[" + time + "] " + msg;
       simConsole.appendChild(div);
       simConsole.scrollTop = simConsole.scrollHeight;
     }

     if (btnSimGemini) {
       btnSimGemini.addEventListener("click", function () {
         isSimulating = true;
         nodes.forEach(function (n) {
           n.classList.remove("active");
           n.classList.remove("outage");
         });
         nodes[0].classList.add("outage");
         nodes[1].classList.add("active");

         addLog("SIMULATE: Gemini (Tier 1) outage triggered.", "system");
         setTimeout(function () {
           addLog("DIAL: Attempting connection to Gemini API...", "system");
         }, 300);
         setTimeout(function () {
           addLog(
             "ERROR: Gemini API connection timeout (504 gateway timeout)",
             "error",
           );
         }, 1000);
         setTimeout(function () {
           addLog(
             "FAILOVER: Initiating secondary fallback routing...",
             "system",
           );
         }, 1600);
         setTimeout(function () {
           addLog(
             "DIAL: Connecting to OpenRouter API (Tier 2)...",
             "system",
           );
         }, 2100);
         setTimeout(function () {
           addLog(
             "SUCCESS: Connection established. Failover handoff completed in 12ms.",
             "success",
           );
         }, 2600);
       });
     }

     if (btnSimRouter) {
       btnSimRouter.addEventListener("click", function () {
         isSimulating = true;
         nodes.forEach(function (n) {
           n.classList.remove("active");
           n.classList.remove("outage");
         });
         nodes[0].classList.add("outage");
         nodes[1].classList.add("outage");
         nodes[2].classList.add("active");

         addLog(
           "SIMULATE: Primary and Secondary provider outages triggered.",
           "system",
         );
         setTimeout(function () {
           addLog("DIAL: Attempting Gemini connection...", "system");
         }, 300);
         setTimeout(function () {
           addLog("ERROR: Gemini API service unavailable.", "error");
         }, 900);
         setTimeout(function () {
           addLog("DIAL: Attempting OpenRouter connection...", "system");
         }, 1400);
         setTimeout(function () {
           addLog("ERROR: OpenRouter returned 502 Bad Gateway.", "error");
         }, 2000);
         setTimeout(function () {
           addLog(
             "FAILOVER: Engaging Tier 3 Groq inference net...",
             "system",
           );
         }, 2500);
         setTimeout(function () {
           addLog(
             "SUCCESS: Routed successfully via Groq in 4ms.",
             "success",
           );
         }, 3100);
       });
     }

     if (btnSimReset) {
       btnSimReset.addEventListener("click", function () {
         isSimulating = false;
         nodes.forEach(function (n) {
           n.classList.remove("active");
           n.classList.remove("outage");
         });
         nodes[0].classList.add("active");
         addLog(
           "RESET: Restoring default routing configuration...",
           "system",
         );
         setTimeout(function () {
           addLog(
             "STATUS: All systems healthy. Auto-routing active.",
             "success",
           );
         }, 600);
         startCycle();
       });
     }

     /* ---------- MOBILE NAV TOGGLE ---------- */
     var navToggle = document.querySelector(".nav-toggle");
     var navLinks = document.querySelector(".nav-links");
     if (navToggle) {
       navToggle.addEventListener("click", function () {
        var open = !document.body.classList.contains("nav-open");
        document.body.classList.toggle("nav-open", open);
        navToggle.setAttribute("aria-expanded", open ? "true" : "false");
        navToggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
      });
      navLinks.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          document.body.classList.remove("nav-open");
          navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        });
      });
     }
   })();

   /* ---------- LOGOUT HELPERS ---------- */
   function handleLogout() {
     const match = document.cookie.match(
       /(?:^|;) ?csrftoken=([^;]*)(?:;|$)/,
     );
     const inp = document.querySelector('input[name="csrfmiddlewaretoken"]');
    const token = match ? match[1] : (inp ? inp.value : "");
     fetch("/api/auth/logout", {
       method: "POST",
       headers: { "X-CSRFToken": token },
     })
       .then(() => window.location.reload())
       .catch(() => window.location.reload());
   }

   /* ==========================================
SCROLL REVEAL ANIMATION
========================================== */
   function triggerStatsCountUp(banner) {
     banner.classList.add("counted");
     const nums = banner.querySelectorAll(".stat-num");
     nums.forEach((num) => {
       const target = parseInt(num.getAttribute("data-val"), 10);
       let current = 0;
       const duration = 1200; // ms
       const stepTime = 15; // ms
       const totalSteps = duration / stepTime;
       const increment = target / totalSteps;

       let step = 0;
       const timer = setInterval(() => {
         step++;
         current += increment;
         if (step >= totalSteps || current >= target) {
           num.textContent = target;
           clearInterval(timer);
         } else {
           num.textContent = Math.floor(current);
         }
       }, stepTime);
     });
   }

   function reveal() {
     const reveals = document.querySelectorAll(".reveal");
     for (let i = 0; i < reveals.length; i++) {
       const windowHeight = window.innerHeight;
       const elementTop = reveals[i].getBoundingClientRect().top;
       const elementVisible = 50;
       if (elementTop < windowHeight - elementVisible) {
         reveals[i].classList.add("active");
         if (
           reveals[i].classList.contains("stats-banner") &&
           !reveals[i].classList.contains("counted")
         ) {
           triggerStatsCountUp(reveals[i]);
         }
       }
     }
   }
   window.addEventListener("scroll", reveal);
   // Trigger once on load
   reveal();

   /* ==========================================
HERO TABS SCROLL & GLIDER UPDATES
========================================== */
   function updateGlider(index) {
     const glider = document.querySelector(".glider");
     if (glider) {
       glider.style.transform = `translateX(${index * 100}%)`;
     }
   }

   document.querySelectorAll("#heroTabs .tab").forEach((tab) => {
     tab.addEventListener("click", function (e) {
       e.preventDefault();
       document
         .querySelectorAll("#heroTabs .tab")
         .forEach((t) => t.classList.remove("active"));
       this.classList.add("active");
       const index = parseInt(this.getAttribute("data-index"), 10);
       updateGlider(index);

       const target = document.querySelector(this.getAttribute("href"));
       if (target) {
         const offset = 140; // Avoid navbar overlay
         const bodyRect = document.body.getBoundingClientRect().top;
         const elementRect = target.getBoundingClientRect().top;
         const elementPosition = elementRect - bodyRect;
         const offsetPosition = elementPosition - offset;

         window.scrollTo({
           top: offsetPosition,
           behavior: "smooth",
         });
       }
     });
   });

   // Intersection Observer to update glider as user scrolls
   const observerOptions = {
     root: null,
     rootMargin: "-30% 0px -50% 0px",
     threshold: 0,
   };

   const observer = new IntersectionObserver((entries) => {
     entries.forEach((entry) => {
       if (entry.isIntersecting) {
         const id = entry.target.getAttribute("id");
         const activeTab = document.querySelector(
           `#heroTabs .tab[href="#${id}"]`,
         );
         if (activeTab) {
           document
             .querySelectorAll("#heroTabs .tab")
             .forEach((t) => t.classList.remove("active"));
           activeTab.classList.add("active");
           const index = parseInt(activeTab.getAttribute("data-index"), 10);
           updateGlider(index);
         }
       }
     });
   }, observerOptions);

   document
     .querySelectorAll(".hero-row")
     .forEach((sec) => observer.observe(sec));

   /* ==========================================
FAQ ACCORDION TOGGLE
========================================== */
   document.querySelectorAll(".faq-trigger").forEach((trigger) => {
     trigger.addEventListener("click", function () {
       const item = this.parentElement;
       const isOpen = item.classList.contains("open");

       document.querySelectorAll(".faq-item").forEach((i) => {
         if (i !== item) i.classList.remove("open");
       });

       if (!isOpen) {
         item.classList.add("open");
       } else {
         item.classList.remove("open");
       }
     });
   });

/* ---------- v6: nav elevation on scroll ---------- */
(function () {
  var nav = document.querySelector(".nav");
  if (!nav) return;
  var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

