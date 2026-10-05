/* ===== CURSOR & MOTION EFFECTS =====
   Loaded in <head> so effect classes land on <html> before the first paint.
   Every effect is opt-in: FX_DEFAULT is what visitors get. Open the site with
   ?demo to get a panel for trying effects; its choices are stored per browser. */
const FX_LIST = [
  ["intro", "Сборка первого экрана при загрузке"],
  ["heroart", "Кинонаезд и блик на главной картинке"],
  ["tilt", "3D-наклон карточек за курсором"],
  ["marquee", "Бегущая строка реагирует на скролл"],
  ["stomp", "Плитки цифр «приземляются»"],
  ["parallax", "Параллакс: стикеры и картинка в рамке"],
  ["letters", "Заголовки подпрыгивают по буквам"],
  ["wobble", "Стикеры покачиваются"],
  ["confetti", "Конфетти после отправки заявки"],
];
const FX_CURSORS = [
  ["default", "Обычный"],
  ["fist", "Рука → кулак + «БАХ!» на кнопках"],
  ["fist-quiet", "Рука → кулак + звёздочки"],
];
const FX_DEFAULT = { cursor: "fist", effects: FX_LIST.map(([id]) => id) };

const root = document.documentElement;

const fx = (() => {
  const params = new URLSearchParams(location.search);
  const demo = params.has("demo");
  let config = FX_DEFAULT;
  if (demo) {
    try {
      config = { ...FX_DEFAULT, ...JSON.parse(localStorage.getItem("punchline-fx-demo") || "{}") };
    } catch {}
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const on = (name) => !reduced && config.effects.includes(name);

  config.effects.forEach((name) => on(name) && root.classList.add("fx-" + name));
  const fistCursor = config.cursor.startsWith("fist") && finePointer;
  if (fistCursor) root.classList.add("fx-cursor-fist");

  return { demo, config, on, reduced, finePointer, fistCursor };
})();

/* ----- Cursor: punch bursts ----- */
const BURST_WORDS = { ru: ["БАХ!", "БУМ!", "ПАУ!", "ВЖУХ!"], en: ["POW!", "BAM!", "BOOM!", "WHAM!"] };
const BURST_COLORS = ["#FFCB2E", "#FF9BCB", "#2E6BFF", "#2BD46B", "#FF4B3E"];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function spawn(className, x, y, styles = {}) {
  const el = document.createElement("span");
  el.className = className;
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, { left: x + "px", top: y + "px", ...styles });
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
  return el;
}

function burstStars(x, y, count = 5) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const dist = 26 + Math.random() * 22;
    spawn("fx-bit-star", x, y, {
      background: pick(BURST_COLORS),
      "--dx": Math.cos(angle) * dist + "px",
      "--dy": Math.sin(angle) * dist + "px",
    });
  }
}

function burstWord(x, y) {
  const lang = document.documentElement.lang === "en" ? "en" : "ru";
  const el = spawn("fx-bit-word", x, y, { background: pick(BURST_COLORS), "--r": (Math.random() * 24 - 12).toFixed(1) + "deg" });
  el.textContent = pick(BURST_WORDS[lang]);
}

/* ----- Cursor -----
   A native cursor image can only be swapped, not animated, so the cursor is an
   element that follows the mouse 1:1 (no easing, so it never lags). On press
   the hand balls into a fist and punches. The CSS image cursors under
   .fx-cursor-fist stay as the fallback until this takes over. */
const CLICKABLE = "a, button, label, .card, .lang-btn";
const CURSOR_SRC = {
  arrow: "materials/cursor-arrow@2x.png",
  point: "materials/cursor-point@2x.png",
  fist: "materials/cursor-fist@2x.png",
};
const CURSOR_HOTSPOT = { arrow: [9, 7], point: [10, 3], fist: [10, 3] };

function initCursor() {
  if (!fx.fistCursor) return;
  const loud = fx.config.cursor === "fist" && !fx.reduced;
  Object.values(CURSOR_SRC).forEach((src) => (new Image().src = src)); // no flicker on the first swap

  const el = document.createElement("div");
  el.className = "fx-cursor hidden";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = '<img alt="" width="32" height="32" />';
  const img = el.firstChild;
  document.body.appendChild(el);
  root.classList.add("fx-cursor-js");

  let state = "", x = -100, y = -100, pressed = false, hovering = false, inField = false;
  const place = () => {
    const [hx, hy] = CURSOR_HOTSPOT[state];
    el.style.transform = `translate3d(${x - hx}px, ${y - hy}px, 0)`;
  };
  const update = () => {
    const next = pressed ? "fist" : hovering ? "point" : "arrow";
    if (next !== state) {
      state = next;
      img.src = CURSOR_SRC[next];
    }
    el.classList.toggle("hidden", inField); // text fields keep the native I-beam
    place();
  };

  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX;
    y = e.clientY;
    update();
  }, { passive: true });
  document.addEventListener("pointerover", (e) => {
    hovering = !!e.target.closest(CLICKABLE);
    inField = !!e.target.closest("input, textarea");
    update();
  });
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    pressed = true;
    root.classList.add("fx-pressing");
    update();
    if (fx.reduced || inField) return;
    el.classList.remove("punch");
    void el.offsetWidth; // restart the punch on rapid clicks
    el.classList.add("punch");
    spawn("fx-bit-ring", x, y);
    const clickable = e.target.closest(CLICKABLE);
    if (loud && clickable) burstWord(x, y);
    else burstStars(x, y, clickable ? 7 : 5);
  });
  const release = () => {
    pressed = false;
    root.classList.remove("fx-pressing");
    update();
  };
  document.addEventListener("pointerup", release);
  window.addEventListener("blur", release);
  document.documentElement.addEventListener("mouseleave", () => el.classList.add("hidden"));
}

/* ----- Card tilt ----- */
function initTilt() {
  if (!fx.on("tilt") || !fx.finePointer) return;
  document.addEventListener("mousemove", (e) => {
    const card = e.target.closest?.(".card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty("--ry", (px * 14).toFixed(2) + "deg");
    card.style.setProperty("--rx", (-py * 14).toFixed(2) + "deg");
  });
  document.addEventListener("mouseout", (e) => {
    const card = e.target.closest?.(".card");
    if (card && !card.contains(e.relatedTarget)) {
      card.style.removeProperty("--rx");
      card.style.removeProperty("--ry");
    }
  });
}

/* ----- Scroll-reactive marquee ----- */
function initMarquee() {
  if (!fx.on("marquee")) return;
  const track = document.getElementById("marquee");
  let x = 0, dir = 1, boost = 0, lastY = scrollY;
  addEventListener("scroll", () => {
    const dy = scrollY - lastY;
    lastY = scrollY;
    if (dy) dir = Math.sign(dy);
    boost = Math.min(boost + Math.abs(dy) * 0.06, 22);
  }, { passive: true });
  (function frame() {
    const half = track.scrollWidth / 2;
    if (half > 0) {
      x -= dir * (0.7 + boost);
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translateX(${x}px) skewX(${(-dir * boost * 0.35).toFixed(2)}deg)`;
    }
    boost *= 0.93;
    requestAnimationFrame(frame);
  })();
}

/* ----- Hero parallax ----- */
// Stickers and the frame drift against the mouse; the art inside the frame
// drifts with it and lags behind the frame on scroll, like a view through a
// window. The art moves via `transform`, which stacks on top of the Ken Burns
// animation's `scale`/`translate`.
function initParallax() {
  if (!fx.on("parallax")) return;
  const hero = document.querySelector(".hero");
  const frameEl = document.querySelector(".frame");
  const art = frameEl.querySelector("img");
  const layers = [
    [".st-visits", 22],
    [".st-hit", 16],
    [".frame", 7],
    ["h1 .hl-y", 6],
    ["h1 .hl-b", 9],
  ].map(([sel, depth]) => [document.querySelector(sel), depth]).filter(([el]) => el);
  let tx = 0, ty = 0, cx = 0, cy = 0;
  if (fx.finePointer) {
    hero.addEventListener("mousemove", (e) => {
      tx = e.clientX / innerWidth - 0.5;
      ty = e.clientY / innerHeight - 0.5;
    });
    hero.addEventListener("mouseleave", () => (tx = ty = 0));
  }
  (function frame() {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    layers.forEach(([el, d]) => (el.style.translate = `${(-cx * d).toFixed(2)}px ${(-cy * d).toFixed(2)}px`));
    const r = frameEl.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      // Capped at 3% of the frame height so the 1.1 overscan always covers it, even on phones.
      const cap = r.height * 0.03;
      const lag = Math.max(-cap, Math.min(cap, (r.top + r.height / 2 - innerHeight / 2) * -0.06));
      art.style.transform = `translate(${(cx * 16).toFixed(2)}px, ${(cy * 8 + lag).toFixed(2)}px)`;
    }
    requestAnimationFrame(frame);
  })();
}

/* ----- Letter-by-letter headings ----- */
function splitLetters(el) {
  let i = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        [...child.textContent].forEach((ch) => {
          const s = document.createElement("span");
          s.className = "fx-letter";
          s.style.setProperty("--i", i++);
          s.textContent = ch === " " ? " " : ch;
          frag.appendChild(s);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };
  walk(el);
}

function initLetters() {
  if (!fx.on("letters")) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      splitLetters(entry.target);
      entry.target.classList.add("fx-letters-go");
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("h2").forEach((h) => io.observe(h));
}

/* ----- Confetti ----- */
function confetti(fromEl) {
  const r = fromEl.getBoundingClientRect();
  for (let i = 0; i < 46; i++) {
    spawn("fx-bit-confetti", r.left + r.width / 2, r.top, {
      background: pick(BURST_COLORS),
      "--dx": (Math.random() * 520 - 260).toFixed(0) + "px",
      "--dy": (-140 - Math.random() * 260).toFixed(0) + "px",
      "--rot": (Math.random() * 900 - 450).toFixed(0) + "deg",
      animationDelay: (Math.random() * 0.12).toFixed(2) + "s",
    });
  }
}

function initConfetti() {
  if (!fx.on("confetti")) return;
  document.addEventListener("punchline:form-sent", (e) => confetti(e.detail.from));
}

/* ----- Demo panel (?demo) ----- */
function initDemoPanel() {
  if (!fx.demo) return;
  const panel = document.createElement("aside");
  panel.className = "fx-panel";
  panel.innerHTML = `
    <div class="fx-panel-head"><b>Эффекты</b><button type="button" data-fx-toggle aria-label="Свернуть">–</button></div>
    <div class="fx-panel-body">
      <p class="fx-panel-label">Курсор</p>
      ${FX_CURSORS.map(([id, label]) => `<label><input type="radio" name="fx-cursor" value="${id}"${fx.config.cursor === id ? " checked" : ""}> ${label}</label>`).join("")}
      <p class="fx-panel-label">Анимации</p>
      ${FX_LIST.map(([id, label]) => `<label><input type="checkbox" value="${id}"${fx.config.effects.includes(id) ? " checked" : ""}> ${label}</label>`).join("")}
      <div class="fx-panel-actions">
        <button type="button" data-fx-all>Включить всё</button>
        <button type="button" data-fx-none>Выключить всё</button>
        <button type="button" data-fx-confetti>Тест конфетти</button>
      </div>
      ${fx.reduced ? '<p class="fx-panel-note">В системе включено «уменьшить движение», поэтому анимации не показываются.</p>' : ""}
    </div>`;
  document.body.appendChild(panel);

  const save = (next) => {
    try {
      localStorage.setItem("punchline-fx-demo", JSON.stringify(next));
    } catch {}
    sessionStorage.setItem("punchline-fx-scroll", String(scrollY));
    location.reload();
  };
  const read = () => ({
    cursor: panel.querySelector('input[name="fx-cursor"]:checked')?.value || "default",
    effects: [...panel.querySelectorAll('input[type="checkbox"]:checked')].map((i) => i.value),
  });
  panel.addEventListener("change", () => save(read()));
  panel.querySelector("[data-fx-all]").addEventListener("click", () => save({ cursor: "fist", effects: FX_LIST.map(([id]) => id) }));
  panel.querySelector("[data-fx-none]").addEventListener("click", () => save({ cursor: "default", effects: [] }));
  panel.querySelector("[data-fx-confetti]").addEventListener("click", (e) => confetti(e.currentTarget));
  panel.querySelector("[data-fx-toggle]").addEventListener("click", () => panel.classList.toggle("collapsed"));

  // Keep the reader's place across the reload a toggle causes (except for the intro, which is the point).
  const y = Number(sessionStorage.getItem("punchline-fx-scroll"));
  sessionStorage.removeItem("punchline-fx-scroll");
  if (y) addEventListener("load", () => scrollTo(0, y));
}

document.addEventListener("DOMContentLoaded", () => {
  initCursor();
  initTilt();
  initMarquee();
  initParallax();
  initLetters();
  initConfetti();
  initDemoPanel();
});
