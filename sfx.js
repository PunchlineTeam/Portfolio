/* ===== SOUND DESIGN =====
   Sounds from Kenney's Interface Sounds and Impact Sounds packs (CC0), picked
   and leveled by ear in a listening session; only their leading silence is
   trimmed (materials/sfx). Played through Web Audio so they start instantly
   and can overlap. Browsers keep audio locked until the first click or key
   press, so nothing plays before the visitor interacts. */
const SFX = {
  punch: { file: "punch", volume: 0.55 },     // click on a button, link or card
  tap: { file: "tap", volume: 0.25 },         // click anywhere else
  hover: { file: "hover", volume: 0.15 },     // pointer enters a button, link or card
  toggle: { file: "toggle", volume: 0.35 },   // RU/EN, "show all", sound on
  success: { file: "success", volume: 0.5 },  // application sent
  error: { file: "error", volume: 0.4 },      // application invalid or failed
};
const SFX_CLICKABLE = "a, button, .card, .lang-btn, .bigword span";
const SFX_HOVERABLE = `${SFX_CLICKABLE}, input, textarea`; // form fields chime on hover, but their labels don't
const SFX_TOGGLES = ".lang-btn, #showAllBtn";

(() => {
  let enabled = true;
  try {
    enabled = localStorage.getItem("punchline-sound") !== "off";
  } catch {}

  const AC = window.AudioContext || window.webkitAudioContext;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const buffers = {};
  let ctx = null;

  // Decode up front with an offline context: it needs no user gesture, and the
  // resulting AudioBuffers play in any context, so the first click is instant.
  function preload() {
    if (!AC || !OAC) return;
    const decoder = new OAC(1, 1, 44100);
    Object.values(SFX).forEach(async ({ file }) => {
      try {
        const data = await (await fetch(`materials/sfx/${file}.mp3`)).arrayBuffer();
        buffers[file] = await decoder.decodeAudioData(data);
      } catch (e) {
        console.warn("Sound failed to load:", file, e);
      }
    });
  }

  function unlock() {
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume();
  }

  function play(name) {
    const { file, volume } = SFX[name];
    const buffer = buffers[file];
    if (!enabled || !ctx || !buffer) return;
    const start = () => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      src.connect(gain).connect(ctx.destination);
      src.start();
    };
    if (ctx.state === "running") start();
    else ctx.resume().then(start);
  }

  function renderButton(btn) {
    btn.setAttribute("aria-pressed", String(enabled));
    btn.classList.toggle("off", !enabled);
  }

  function init() {
    const btn = document.getElementById("soundBtn");
    if (btn) {
      renderButton(btn);
      btn.addEventListener("click", () => {
        enabled = !enabled;
        try {
          localStorage.setItem("punchline-sound", enabled ? "on" : "off");
        } catch {}
        renderButton(btn);
        if (enabled) play("toggle");
      });
    }

    // Capture phase: the context unlocks before the handlers below try to play.
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);

    document.addEventListener("pointerdown", (e) => {
      // The mute button plays its own sound; form fields (incl. their labels) and the demo panel stay quiet.
      if (e.button !== 0 || e.target.closest(".field, input, textarea, .sound-btn, .fx-panel")) return;
      if (e.target.closest(SFX_TOGGLES)) play("toggle");
      else if (e.target.closest(SFX_CLICKABLE)) play("punch");
      else play("tap");
    });

    let hovered = null;
    let lastHoverAt = 0;
    document.addEventListener("pointerover", (e) => {
      if (e.pointerType !== "mouse") return;
      const el = e.target.closest(SFX_HOVERABLE);
      if (el === hovered) return;
      hovered = el;
      // Only once audio is unlocked: hovers queued before the first click would all fire at once.
      if (!el || !ctx || ctx.state !== "running" || e.target.closest(".fx-panel")) return;
      const now = performance.now();
      if (now - lastHoverAt < 60) return;
      lastHoverAt = now;
      play("hover");
    });

    document.addEventListener("punchline:form-sent", () => play("success"));
    document.addEventListener("punchline:form-error", () => play("error"));

    if (document.readyState === "complete") preload();
    else addEventListener("load", preload);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
