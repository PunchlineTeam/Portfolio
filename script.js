/* ===== SOUND FX ===== */
const SoundFX = (() => {
  let ctx = null;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function hover() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.012, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  }

  function click() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.07);
  }

  return { init, hover, click };
})();

const SOUND_HOVER_SEL = ".btn, .nav-link, .game-card, .stat-card, .lang-btn, .group-chip";
const SOUND_CLICK_SEL = ".btn, .nav-link, .game-card, .lang-btn, .group-chip, .mobile-toggle";

function initSoundFX() {
  // Init audio context on first interaction (autoplay policy)
  document.addEventListener("click", () => SoundFX.init(), { once: true });

  // Hover sounds via event delegation
  document.addEventListener("mouseover", (e) => {
    const el = e.target.closest(SOUND_HOVER_SEL);
    if (el && !el._soundHovered) {
      el._soundHovered = true;
      SoundFX.hover();
      el.addEventListener("mouseleave", () => { el._soundHovered = false; }, { once: true });
    }
  });

  // Click sounds via event delegation
  document.addEventListener("click", (e) => {
    if (e.target.closest(SOUND_CLICK_SEL)) {
      SoundFX.click();
    }
  });
}

/* ===== TRANSLATIONS ===== */
const translations = {
  ru: {
    navPortfolio: "Портфолио",
    navAbout: "О нас",
    navContact: "Контакты",
    heroBadge: "Roblox Game Studio",
    heroTitle1: "Создаём хиты",
    heroTitle2: "в Roblox",
    heroVisitsLabel: "посещений",
    heroGamesLabel: "игр",
    heroPlayingLabel: "онлайн",
    heroMembersLabel: "подписчиков",
    heroCtaPrimary: "Наши игры",
    heroCtaSecondary: "Связаться",
    heroPlatform: "Доступно на",
    statVisits: "Посещений",
    statMembers: "Подписчиков",
    statGames: "Игр создано",
    statGroups: "Групп",
    statPlaying: "Играют сейчас",
    portfolioTag: "Наши работы",
    portfolioTitle: "Портфолио",
    portfolioDesc: "Roblox игры, в которые играют миллионы",
    showAll: "Показать всё",
    hideAll: "Скрыть",
    aboutTag: "О проекте",
    aboutTitle: "Punchline Team",
    aboutText1:
      "Мы - команда разработчиков, создающая популярные игры на платформе Roblox. Наши проекты объединены под несколькими группами и суммарно набрали более 1 миллиарда посещений.",
    aboutText2:
      "Каждый наш проект создаётся с вниманием к деталям, уникальным геймплеем и высоким качеством.",
    groupsTitle: "Наши группы",
    contactTag: "ПРИСОЕДИНЯЙСЯ К КОМАНДЕ",
    contactTitle: "Мы ищем таланты",
    contactDesc: "Мы растём и ищем специалистов: программистов, 3D-артистов, аниматоров, GUI-дизайнеров, саунд-дизайнеров, VFX-художников и не только. Если ты крутой в своём деле — напиши нам.",
    contactCta: "Отправить заявку",
    formName: "Имя",
    formNamePh: "Ваше имя",
    formContact: "Telegram / Email",
    formContactPh: "@username или email",
    formRole: "Специализация",
    formRolePh: "Программист, 3D-артист, аниматор...",
    formMessage: "О себе",
    formMessagePh: "Расскажите о своём опыте, покажите портфолио или примеры работ...",
    formHint: "Или напишите в <a href=\"https://discord.gg/HREvzvTR9T\" target=\"_blank\">Discord</a> ↗",
    formFooter: "Без обязательств · Ответ в течение 48 часов",
    formSuccess: "Заявка отправлена!",
    formError: "Ошибка отправки. Попробуйте позже.",
    expectTag: "КАК ЭТО РАБОТАЕТ",
    expectTitle: "Простой и честный процесс.",
    step1Title: "Изучаем вашу заявку",
    step1Desc: "Смотрим портфолио, опыт и навыки. Обычно отвечаем в течение 48 часов.",
    step2Title: "Тестовое задание",
    step2Desc: "Небольшая задача в вашей области, чтобы понять уровень и стиль работы.",
    step3Title: "Знакомство с командой",
    step3Desc: "Общаемся, обсуждаем проекты, отвечаем на ваши вопросы.",
    step4Title: "Начало работы",
    step4Desc: "Если всё совпало — добро пожаловать в Punchline Team.",
    footerDesc: "Команда, создающая игры, в которые играют миллионы.",
    footerNav: "Навигация",
    footerContact: "Контакты",
    footerRights: "Все права защищены.",
    copySuccess: "Скопировано!"
  },
  en: {
    navPortfolio: "Portfolio",
    navAbout: "About",
    navContact: "Contact",
    heroBadge: "Roblox Game Studio",
    heroTitle1: "Creating viral games",
    heroTitle2: "on Roblox",
    heroVisitsLabel: "visits",
    heroGamesLabel: "games",
    heroPlayingLabel: "online",
    heroMembersLabel: "subscribers",
    heroCtaPrimary: "Our Games",
    heroCtaSecondary: "Contact Us",
    heroPlatform: "Available on",
    statVisits: "Total Visits",
    statMembers: "Subscribers",
    statGames: "Games Created",
    statGroups: "Communities",
    statPlaying: "Playing Now",
    portfolioTag: "Our work",
    portfolioTitle: "Portfolio",
    portfolioDesc:
      "Games played by millions on the Roblox platform",
    showAll: "Show All",
    hideAll: "Hide",
    aboutTag: "About us",
    aboutTitle: "Punchline Team",
    aboutText1:
      "We are a team of developers creating popular games on the Roblox platform. Our projects are united under multiple communities and have accumulated over 1 billion visits combined.",
    aboutText2:
      "Each project is crafted with attention to detail, unique gameplay, and high quality.",
    groupsTitle: "Our Studios",
    contactTag: "JOIN THE TEAM",
    contactTitle: "We're hiring talent",
    contactDesc: "We're growing and looking for: programmers, 3D artists, animators, GUI designers, sound designers, VFX artists, and more. If you're great at what you do — reach out.",
    contactCta: "Send application",
    formName: "Name",
    formNamePh: "Your name",
    formContact: "Telegram / Email",
    formContactPh: "@username or email",
    formRole: "Specialty",
    formRolePh: "Programmer, 3D artist, animator...",
    formMessage: "About you",
    formMessagePh: "Tell us about your experience, share your portfolio or work samples...",
    formHint: "Or text on <a href=\"https://discord.gg/HREvzvTR9T\" target=\"_blank\">Discord</a> ↗",
    formFooter: "No commitment · Response within 48 hours",
    formSuccess: "Application sent!",
    formError: "Failed to send. Try again later.",
    expectTag: "HOW IT WORKS",
    expectTitle: "Simple and honest process.",
    step1Title: "We review your application",
    step1Desc: "We look at your portfolio, experience, and skills. Usually respond within 48 hours.",
    step2Title: "Test task",
    step2Desc: "A small task in your area to understand your level and working style.",
    step3Title: "Meet the team",
    step3Desc: "We chat, discuss projects, and answer your questions.",
    step4Title: "Welcome aboard",
    step4Desc: "If it's a match — welcome to Punchline Team.",
    footerDesc: "A Roblox studio creating games played by millions.",
    footerNav: "Navigation",
    footerContact: "Contact",
    footerRights: "All rights reserved.",
    copySuccess: "Copied!"
  },
};

/* ===== GAME DATA ===== */
let gamesData = null;
const VISIBLE_COUNT = 12;
let showingAll = false;

/* ===== HELPERS ===== */
function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B+";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M+";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K+";
  return String(n);
}

function formatCountUp(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B+";
  if (n >= 1e6) return (n / 1e6).toFixed(0) + "M+";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K+";
  return String(n);
}

/* ===== LANGUAGE ===== */
let currentLang = "ru";

function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem("punchline-lang", lang);
  } catch {}
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key]) {
      if (key === "formHint") {
        el.innerHTML = translations[lang][key];
      } else {
        el.textContent = translations[lang][key];
      }
      if (el.hasAttribute("data-text")) {
        el.setAttribute("data-text", translations[lang][key]);
      }
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });
  // Update dynamic about text with real numbers
  if (gamesData) {
    const t1El = document.querySelector('[data-i18n="aboutText1"]');
    if (t1El) {
      const billionStr = (gamesData.totalVisits / 1e9).toFixed(1);
      if (lang === "ru") {
        t1El.textContent = `Мы — команда разработчиков, создающая популярные игры на платформе Roblox. Наши проекты объединены под несколькими группами и суммарно набрали более ${billionStr} миллиарда визитов.`;
      } else {
        t1El.textContent = `We are a team of developers creating popular games on the Roblox platform. Our projects are united under multiple communities and have accumulated over ${billionStr} billion visits combined.`;
      }
    }
  }
}

/* ===== NAVBAR ===== */
function initNavbar() {
  const navbar = document.getElementById("navbar");
  const toggle = document.getElementById("mobileToggle");
  const links = document.getElementById("navLinks");

  window.addEventListener(
    "scroll",
    () => {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    },
    { passive: true }
  );

  toggle.addEventListener("click", () => {
    toggle.classList.toggle("open");
    links.classList.toggle("open");
    document.body.style.overflow = links.classList.contains("open")
      ? "hidden"
      : "";
  });

  links.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      toggle.classList.remove("open");
      links.classList.remove("open");
      document.body.style.overflow = "";
    });
  });
}

/* ===== SCROLL ANIMATIONS ===== */
function initScrollAnimations() {
  const elements = document.querySelectorAll("[data-animate]");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || "0", 10);
          setTimeout(() => el.classList.add("in-view"), delay);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.05 }
  );

  elements.forEach((el) => observer.observe(el));
}

/* ===== COUNT UP ===== */
function animateCountUp(el, target, suffix = "") {
  const duration = 2000;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = formatCountUp(current) + (current === 0 && suffix ? "" : "");
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = formatCountUp(target);
  }

  requestAnimationFrame(update);
}

function initCountUp() {
  if (!gamesData) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const statVisits = document.getElementById("statVisits");
          const statMembers = document.getElementById("statMembers");
          const statGames = document.getElementById("statGames");
          const statGroups = document.getElementById("statGroups");
          const statPlaying = document.getElementById("statPlaying");
          animateCountUp(statVisits, gamesData.totalVisits);
          animateCountUp(statMembers, gamesData.totalMembers);
          animateCountUp(statGames, gamesData.totalGames);
          animateCountUp(statGroups, gamesData.totalGroups);
          animateCountUp(statPlaying, gamesData.totalPlaying);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(document.getElementById("stats"));
}

/* ===== RENDER GAMES ===== */
function renderGames() {
  if (!gamesData) return;

  const grid = document.getElementById("gamesGrid");
  const games = gamesData.games;

  grid.innerHTML = "";

  games.forEach((game, i) => {
    const card = document.createElement("a");
    card.className = "game-card" + (i >= VISIBLE_COUNT ? " hidden-card" : "");
    card.href = game.gameUrl;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    card.innerHTML = `
      <div class="game-thumb-wrap">
        <img
          class="game-thumb"
          src="${game.thumbnailUrl}"
          alt="${game.name}"
          loading="${i < 8 ? "eager" : "lazy"}"
        />
      </div>
      <div class="game-info">
        <div class="game-name">${game.name}</div>
        <div class="game-visits">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          ${formatNumber(game.visits)}
        </div>
        <div class="game-group">${game.groupName}</div>
      </div>
    `;

    grid.appendChild(card);

    // Staggered appearance
    setTimeout(() => {
      card.classList.add("visible");
    }, 60 * Math.min(i, VISIBLE_COUNT));
  });

  // Show/hide toggle
  const moreBtn = document.getElementById("portfolioMore");
  if (games.length <= VISIBLE_COUNT) {
    moreBtn.style.display = "none";
  }

  document.getElementById("showAllBtn").addEventListener("click", () => {
    showingAll = !showingAll;
    const cards = grid.querySelectorAll(".game-card");
    cards.forEach((card, i) => {
      if (i >= VISIBLE_COUNT) {
        if (showingAll) {
          card.classList.remove("hidden-card");
          setTimeout(() => card.classList.add("visible"), 40 * (i - VISIBLE_COUNT));
        } else {
          card.classList.add("hidden-card");
          card.classList.remove("visible");
        }
      }
    });
    const key = showingAll ? "hideAll" : "showAll";
    document.querySelector("#showAllBtn [data-i18n]").setAttribute("data-i18n", key);
    document.querySelector("#showAllBtn [data-i18n]").textContent =
      translations[currentLang][key];
  });
}

/* ===== RENDER GROUPS ===== */
function renderGroups() {
  const groups = [
    { name: "Punchline Team", id: 33016906 },
    { name: "Punchline Studio", id: 17004458 },
    { name: "Punchline Lite", id: 34943400 },
    { name: "Punchline Ultra", id: 35497063 },
    { name: "PunchLineX Studio", id: 546395507 },
    { name: "Punchlite Digital", id: 498378381 },
    { name: "Brain Trip Studio", id: 562599395 },
    { name: "Bum Bun Games", id: 35982430 },
    { name: "Rot Brain Monkey", id: 789093649 },
    { name: "Shma Team", id: 69921098 },
    { name: "Ultra Crabers", id: 446440196 },
    { name: "Wind Sun Moon WSM", id: 480951000 },
    { name: "Brigade Of Figures", id: 366879284 },
    { name: "Mission Of Future", id: 35962840 },
  ];

  const grid = document.getElementById("groupsGrid");
  if (!grid) return;
  grid.innerHTML = groups
    .map(
      (g) =>
        `<a class="group-chip" href="https://www.roblox.com/groups/${g.id}" target="_blank" rel="noopener">${g.name}</a>`
    )
    .join("");
}

/* ===== HERO STATS ===== */
function updateHeroStats() {
  if (!gamesData) return;
  document.getElementById("heroVisits").textContent = formatNumber(gamesData.totalVisits);
  document.getElementById("heroGames").textContent = String(gamesData.totalGames);
  document.getElementById("heroPlaying").textContent = formatNumber(gamesData.totalPlaying);
  if (gamesData.totalMembers) {
    document.getElementById("heroMembers").textContent = formatNumber(gamesData.totalMembers);
  }
}

/* ===== FOOTER YEAR ===== */
function updateYear() {
  document.getElementById("footerYear").textContent = new Date().getFullYear();
}
/* ===== CLIPBOARD ===== */
function initClipboard() {
  const copyDiscordBtn = document.getElementById('copyDiscord');
  
  if (copyDiscordBtn) {
    copyDiscordBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      navigator.clipboard.writeText('punchline_team');
      
      const textSpan = this.querySelector('span');
      
      textSpan.innerText = translations[currentLang].copySuccess;
      
      textSpan.style.color = '#72e095';
      
      setTimeout(() => {
        textSpan.innerText = 'punchline_team';
        textSpan.style.color = '';
      }, 2000);
    });
  }
}
/* ===== INIT ===== */
async function init() {
  // Load data
  try {
    const res = await fetch("games-data.json");
    gamesData = await res.json();
  } catch (e) {
    console.error("Failed to load game data:", e);
  }

  // Init language
  let savedLang = null;
  try {
    savedLang = localStorage.getItem("punchline-lang");
  } catch {}
  currentLang = savedLang === "en" ? "en" : "ru";

  // Setup
  initNavbar();
  updateYear();
  try { renderGroups(); } catch (e) { console.error("renderGroups:", e); }

  if (gamesData) {
    updateHeroStats();
    try { renderGames(); } catch (e) { console.error("renderGames:", e); }
    initCountUp();
  }

  setLanguage(currentLang);

  // Lang switch listeners
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });

  // Scroll animations
  initScrollAnimations();

  // Sound effects
  initSoundFX();

  // Copy Discord Tag
  initClipboard();

  // Contact form → Telegram
  initContactForm();
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector(".contact-submit span");
    const origText = btn.textContent;
    btn.textContent = "...";

    const name = form.name.value.trim();
    const contact = form.contact.value.trim();
    const role = form.role.value.trim();
    const message = form.message.value.trim();

    const text = `📩 Новая заявка с сайта\n\n👤 Имя: ${name}\n📱 Контакт: ${contact}\n🎯 Специализация: ${role}\n\n📝 О себе:\n${message}`;

    try {
      const res = await fetch("https://api.telegram.org/bot8795143865:AAHDkD6JwkrecMJC31J5GWU52fi1lz3Qjzo/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: -5189423412, text, parse_mode: "HTML" }),
      });
      if (res.ok) {
        btn.textContent = translations[currentLang].formSuccess;
        btn.style.color = "#72e095";
        form.reset();
        setTimeout(() => { btn.textContent = origText; btn.style.color = ""; }, 3000);
      } else {
        throw new Error("send failed");
      }
    } catch {
      btn.textContent = translations[currentLang].formError;
      btn.style.color = "#ff6b6b";
      setTimeout(() => { btn.textContent = origText; btn.style.color = ""; }, 3000);
    }
  });
}

document.addEventListener("DOMContentLoaded", init);

/* ===== CUSTOM CURSOR ===== */
(() => {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const cursor = document.getElementById("customCursor");
  const cursorText = cursor.querySelector(".cursor-text");
  if (!cursor) return;

  let mouseX = -100, mouseY = -100;
  let cursorX = -100, cursorY = -100;
  let rafId = null;

  // Smooth lerp follow
  function animate() {
    const speed = 0.15;
    cursorX += (mouseX - cursorX) * speed;
    cursorY += (mouseY - cursorY) * speed;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%) scale(${isClicking ? 0.75 : 1})`;
    rafId = requestAnimationFrame(animate);
  }

  let isClicking = false;

  // Hover targets with optional labels
  const hoverTargets = [
    { selector: "a", label: "" },
    { selector: "button", label: "" },
    { selector: ".game-card", label: "View" },
    { selector: ".btn", label: "" },
    { selector: ".nav-logo", label: "" },
    { selector: ".lang-btn", label: "" },
    { selector: "[role='button']", label: "" },
  ];

  function getHoverLabel(target) {
    for (const { selector, label } of hoverTargets) {
      if (target.closest(selector)) return label;
    }
    return null;
  }

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!cursor.classList.contains("visible")) {
      cursor.classList.add("visible");
      document.documentElement.classList.add("custom-cursor-active");
      cursorX = mouseX;
      cursorY = mouseY;
    }

    const label = getHoverLabel(e.target);
    if (label !== null) {
      cursor.classList.add("hover");
      cursorText.textContent = label;
    } else {
      cursor.classList.remove("hover");
      cursorText.textContent = "";
    }
  });

  document.addEventListener("mousedown", () => {
    isClicking = true;
  });

  document.addEventListener("mouseup", () => {
    isClicking = false;
  });

  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("visible");
  });

  document.addEventListener("mouseenter", () => {
    cursor.classList.add("visible");
  });

  animate();
})();
