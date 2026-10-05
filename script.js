/* ===== TRANSLATIONS ===== */
const translations = {
  ru: {
    navGames: "Игры",
    navStats: "Цифры",
    navJoin: "Команда",
    navCta: "Вступить",
    heroLine1: "Делаем",
    heroHits: "хиты",
    heroFor: "для",
    heroCtaGames: "Смотреть игры",
    heroCtaJoin: "Вступить в команду",
    statVisits: "визитов во всех играх",
    statMembers: "подписчиков в группах",
    statGames: "игр с 1 млн+ визитов",
    statPeak: "рекорд онлайна в одной игре",
    gamesTitle: "Наши хиты",
    showLess: "Свернуть",
    joinTitle1: "Ищем",
    joinTitle2: "таланты",
    joinText: "Растём и собираем людей, которые делают игры лучше, чем вчера. Если ты крут в своём деле — напиши, ответим за 48 часов.",
    role1: "Программисты Luau",
    role2: "3D-артисты",
    role3: "Аниматоры",
    role4: "GUI-дизайнеры",
    role5: "Саунд-дизайнеры",
    role6: "VFX-художники",
    step1: "Заявка — ответим за 48 часов",
    step2: "Небольшое тестовое задание",
    step3: "Знакомство с командой",
    step4: "Добро пожаловать в Punchline",
    formTitle: "Заявка",
    formName: "Имя",
    formNamePh: "Алекс",
    formContact: "Telegram или email",
    formContactPh: "@username",
    formRole: "Специализация",
    formRolePh: "3D-артист",
    formMessage: "О себе",
    formMessagePh: "Опыт и ссылки на портфолио",
    formSubmit: "Отправить заявку",
    formSending: "Отправляем…",
    formSuccess: "Заявка отправлена!",
    formError: "Не получилось отправить. Попробуй ещё раз или напиши нам в Discord.",
    formInvalid: "Заполни все поля.",
    formNote: "Без обязательств. Ответ в течение 48 часов.",
    footerRights: "Все права защищены.",
    footerDiscord: "Discord-сервер",
    copySuccess: "Скопировано!",
    loadError: "Не удалось загрузить игры. Обнови страницу чуть позже.",
  },
  en: {
    navGames: "Games",
    navStats: "Numbers",
    navJoin: "Team",
    navCta: "Join us",
    heroLine1: "We make",
    heroHits: "hits",
    heroFor: "for",
    heroCtaGames: "Explore games",
    heroCtaJoin: "Join the team",
    statVisits: "visits across all games",
    statMembers: "group members",
    statGames: "games with 1M+ visits",
    statPeak: "peak players in one game",
    gamesTitle: "Our hits",
    showLess: "Show less",
    joinTitle1: "Hiring",
    joinTitle2: "talent",
    joinText: "We're growing and looking for people who make games better than yesterday. If you're great at what you do, drop us a line — we reply within 48 hours.",
    role1: "Luau scripters",
    role2: "3D artists",
    role3: "Animators",
    role4: "UI designers",
    role5: "Sound designers",
    role6: "VFX artists",
    step1: "Apply — we reply within 48 hours",
    step2: "A small test task",
    step3: "Meet the team",
    step4: "Welcome to Punchline",
    formTitle: "Application",
    formName: "Name",
    formNamePh: "Alex",
    formContact: "Telegram or email",
    formContactPh: "@username",
    formRole: "Specialty",
    formRolePh: "3D artist",
    formMessage: "About you",
    formMessagePh: "Experience and portfolio links",
    formSubmit: "Send application",
    formSending: "Sending…",
    formSuccess: "Application sent!",
    formError: "Couldn't send it. Try again or message us on Discord.",
    formInvalid: "Fill in all fields.",
    formNote: "No strings attached. We reply within 48 hours.",
    footerRights: "All rights reserved.",
    footerDiscord: "Discord server",
    copySuccess: "Copied!",
    loadError: "Couldn't load games. Refresh in a bit.",
  },
};

const t = (key) => translations[currentLang][key];

/* ===== STATE ===== */
const STATS_ENDPOINT = "https://punchline-form-proxy.punchlineteam.workers.dev/stats";
// Form submissions go through a Cloudflare Worker that holds the Telegram bot
// token server-side (see worker/).
const FORM_ENDPOINT = "https://punchline-form-proxy.punchlineteam.workers.dev";
const VISIBLE_COUNT = 8;

let gamesData = null;
let currentLang = "ru";
let showingAll = false;
let statsCounted = false;

/* ===== FORMATTING ===== */
function trimNum(x, digits) {
  const s = x.toFixed(digits).replace(/\.?0+$/, "");
  return currentLang === "ru" ? s.replace(".", ",") : s;
}

function fmtFull(n) {
  return Math.round(n).toLocaleString(currentLang === "ru" ? "ru-RU" : "en-US");
}

function fmtShort(n) {
  const ru = currentLang === "ru";
  if (n >= 1e9) return trimNum(n / 1e9, 2) + (ru ? " млрд" : "B");
  if (n >= 1e6) return trimNum(n / 1e6, n >= 1e8 ? 0 : 1) + (ru ? " млн" : "M");
  return fmtFull(n);
}

// Russian plural: plural(5, ["игра", "игры", "игр"]) → "игр"
function plural(n, [one, few, many]) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function escapeHTML(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function peakCCU() {
  return Math.max(0, ...gamesData.games.map((g) => Math.max(g.peakCCU || 0, g.playing || 0)));
}

const STAT_VALUES = {
  totalVisits: () => [gamesData.totalVisits, fmtShort],
  totalMembers: () => [gamesData.totalMembers, fmtShort],
  totalGames: () => [gamesData.totalGames, fmtFull],
  peak: () => [peakCCU(), fmtFull],
};

/* ===== DATA ===== */
async function fetchJSON(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function loadData() {
  // Freshest source first:
  //   1. Live stats from the Worker (queries Roblox on request, ~1 min cache).
  //   2. The latest committed snapshot from the repo (the cron only manages to run
  //      every few hours, and the Pages deploy can lag behind it).
  //   3. The copy deployed alongside this page.
  const sources = [
    STATS_ENDPOINT,
    "https://raw.githubusercontent.com/PunchlineTeam/Portfolio/master/games-data.json?v=" + Date.now(),
    "games-data.json?v=" + Date.now(),
  ];
  // Local preview: the Worker only allows the production origin, and the working
  // copy's games-data.json may hold changes that aren't pushed yet.
  if (["localhost", "127.0.0.1"].includes(location.hostname)) sources.unshift(sources.pop());
  for (const url of sources) {
    try {
      return await fetchJSON(url, 6000);
    } catch (e) {
      console.warn("Stats source failed, trying next:", url, e);
    }
  }
  console.error("Failed to load game data from all sources");
  return null;
}

// Visits as words, rounded to half a billion so the claim stays true as the number
// grows: 1.49B → "почти полтора миллиарда", 1.62B → "больше полутора миллиардов".
const RU_BILLIONS = {
  // half-billions: [nominative after "почти", genitive after "больше"]
  2: ["миллиард", "миллиарда"],
  3: ["полтора миллиарда", "полутора миллиардов"],
  4: ["два миллиарда", "двух миллиардов"],
  5: ["два с половиной миллиарда", "двух с половиной миллиардов"],
  6: ["три миллиарда", "трёх миллиардов"],
  7: ["три с половиной миллиарда", "трёх с половиной миллиардов"],
  8: ["четыре миллиарда", "четырёх миллиардов"],
  9: ["четыре с половиной миллиарда", "четырёх с половиной миллиардов"],
  10: ["пять миллиардов", "пяти миллиардов"],
};

function visitsPhrase(visits) {
  const halves = visits / 5e8;
  const up = Math.ceil(halves);
  const nearly = up > halves && up - halves < 0.1; // within 50M below the next half-billion
  const key = nearly ? up : Math.floor(halves);
  if (currentLang === "en") {
    return `${nearly ? "nearly" : "over"} ${trimNum(key / 2, 1)} billion`;
  }
  const words = RU_BILLIONS[key];
  if (!words) return fmtShort(visits); // outside the table: fall back to digits
  return nearly ? `почти ${words[0]}` : `больше ${words[1]}`;
}

/* ===== RENDER ===== */
function renderHero() {
  const visits = gamesData.totalVisits;
  const ru = currentLang === "ru";

  document.getElementById("heroLead").textContent = ru
    ? `В наши игры зашли ${visitsPhrase(visits)} раз. Обби, выживание, брейнрот — всё, во что хочется позвать друга.`
    : `Our games have been played ${visitsPhrase(visits)} times. Obbies, survival, brainrot — everything you'd drag a friend into.`;

  const billions = visits >= 1e9;
  document.getElementById("stickerVisits").textContent = trimNum(visits / (billions ? 1e9 : 1e6), 2);
  document.getElementById("stickerVisitsUnit").textContent = ru
    ? `${billions ? "млрд" : "млн"} визитов`
    : `${billions ? "billion" : "million"} visits`;
  const members = fmtShort(gamesData.totalMembers);
  document.getElementById("stickerMembers").textContent = ru
    ? `${members} подписчиков в наших группах`
    : `${members} members in our groups`;
}

function renderMarquee() {
  const names = gamesData.games.slice(0, 10).map((g) => `<span>${escapeHTML(g.name)}</span>`).join("");
  document.getElementById("marquee").innerHTML = names + names;
}

function renderStats() {
  if (!statsCounted) return; // the count-up fills them in when they scroll into view
  document.querySelectorAll("[data-count]").forEach((el) => {
    const [value, format] = STAT_VALUES[el.dataset.count]();
    el.textContent = format(value);
  });
}

function renderGames() {
  const grid = document.getElementById("gamesGrid");
  const rerender = grid.children.length > 0; // e.g. a language switch: don't replay the entrance
  grid.innerHTML = gamesData.games
    .map(
      (g, i) => `
      <a class="card reveal${i >= VISIBLE_COUNT && !showingAll ? " is-hidden" : ""}" href="${escapeHTML(g.gameUrl)}" target="_blank" rel="noopener">
        <span class="rank">${i + 1}</span>
        <img src="${escapeHTML(g.thumbnailUrl)}" alt="${escapeHTML(g.name)}" width="768" height="432" loading="${i < 4 ? "eager" : "lazy"}" />
        <div class="card-body">
          <h3>${escapeHTML(g.name)}</h3>
          <small>${escapeHTML(g.groupName)}</small>
          <span class="pill">${fmtShort(g.visits)} ${currentLang === "ru" ? "визитов" : "visits"}</span>
        </div>
      </a>`
    )
    .join("");
  grid.querySelectorAll(".reveal").forEach((el) => (rerender ? el.classList.add("in") : observeReveal(el)));
  renderShowAll();
}

function renderShowAll() {
  const n = gamesData.games.length;
  const wrap = document.getElementById("moreWrap");
  wrap.hidden = n <= VISIBLE_COUNT;
  document.getElementById("showAllBtn").textContent = showingAll
    ? t("showLess")
    : currentLang === "ru"
      ? `Все ${n} ${plural(n, ["игра", "игры", "игр"])} →`
      : `Show all ${n} games →`;
}

function renderDynamic() {
  if (!gamesData) return;
  renderHero();
  renderMarquee();
  renderStats();
  renderGames();
}

/* ===== LANGUAGE ===== */
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
    const value = t(el.dataset.i18n);
    if (value) el.textContent = value;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const value = t(el.dataset.i18nPlaceholder);
    if (value) el.placeholder = value;
  });
  document.getElementById("formError").textContent = ""; // it was in the old language
  renderDynamic();
}

/* ===== MOTION ===== */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);

function observeReveal(el) {
  if (reduceMotion) el.classList.add("in");
  else revealObserver.observe(el);
}

function initReveal() {
  document.querySelectorAll(".head, .stat, .join-text, .form").forEach((el) => {
    el.classList.add("reveal");
    observeReveal(el);
  });
}

function countUp(el, target, format) {
  if (reduceMotion) {
    el.textContent = format(target);
    return;
  }
  const duration = 1600;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = format(p < 1 ? Math.floor(target * eased) : target);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initCountUp() {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      statsCounted = true;
      document.querySelectorAll("[data-count]").forEach((el) => {
        const [value] = STAT_VALUES[el.dataset.count]();
        // Re-read the formatter on every frame so a language switch mid-animation still applies.
        countUp(el, value, (v) => STAT_VALUES[el.dataset.count]()[1](v));
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(document.getElementById("stats"));
}

/* ===== SHOW ALL ===== */
function initShowAll() {
  document.getElementById("showAllBtn").addEventListener("click", () => {
    showingAll = !showingAll;
    document.querySelectorAll("#gamesGrid .card").forEach((card, i) => {
      if (i >= VISIBLE_COUNT) card.classList.toggle("is-hidden", !showingAll);
    });
    renderShowAll();
    if (!showingAll) document.getElementById("games").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });
}

/* ===== CONTACT FORM ===== */
function initContactForm() {
  const form = document.getElementById("contactForm");
  const submit = document.getElementById("formSubmit");
  const label = submit.querySelector("span");
  const error = document.getElementById("formError");
  const fields = ["name", "contact", "role", "message"];

  form.addEventListener("input", (e) => {
    e.target.closest(".field")?.classList.remove("invalid");
    error.textContent = "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const values = Object.fromEntries(fields.map((f) => [f, form.elements[f].value.trim()]));
    const empty = fields.filter((f) => !values[f]);
    empty.forEach((f) => form.elements[f].closest(".field").classList.add("invalid"));
    if (empty.length) {
      error.textContent = t("formInvalid");
      form.elements[empty[0]].focus();
      return;
    }

    submit.disabled = true;
    label.textContent = t("formSending");
    error.textContent = "";
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: form.elements.website.value }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      form.reset();
      form.classList.add("sent");
      label.textContent = t("formSuccess");
      setTimeout(() => {
        form.classList.remove("sent");
        label.textContent = t("formSubmit");
      }, 4000);
    } catch (err) {
      console.error("Form send failed:", err);
      error.textContent = t("formError");
      label.textContent = t("formSubmit");
    } finally {
      submit.disabled = false;
    }
  });
}

/* ===== DISCORD TAG ===== */
function initClipboard() {
  const btn = document.getElementById("copyDiscord");
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.tag);
      btn.textContent = t("copySuccess");
      setTimeout(() => (btn.textContent = btn.dataset.tag), 2000);
    } catch {}
  });
}

/* ===== INIT ===== */
async function init() {
  let savedLang = null;
  try {
    savedLang = localStorage.getItem("punchline-lang");
  } catch {}
  setLanguage(savedLang === "en" ? "en" : "ru");

  document.getElementById("year").textContent = new Date().getFullYear();
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });
  initReveal();
  initShowAll();
  initContactForm();
  initClipboard();

  gamesData = await loadData();
  if (!gamesData) {
    document.getElementById("gamesGrid").textContent = t("loadError");
    document.getElementById("moreWrap").hidden = true;
    return;
  }
  renderDynamic();
  initCountUp();
}

document.addEventListener("DOMContentLoaded", init);
