document.addEventListener("DOMContentLoaded", () => {
  // Motion toggle
  const motionToggle = document.getElementById("motion-toggle");
  if (motionToggle) {
    motionToggle.addEventListener("click", () => {
      const isOff = document.documentElement.dataset.motion === "off";
      const next = isOff ? "on" : "off";
      document.documentElement.dataset.motion = next;
      motionToggle.setAttribute("aria-pressed", String(next === "off"));
      motionToggle.textContent = next === "off" ? "움직임 켜기" : "움직임 줄이기";
    });
  }

  // Strength accordions
  document.querySelectorAll(".strength-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      if (panel) panel.hidden = expanded;
      const sign = button.querySelector(".strength-sign");
      if (sign) sign.textContent = expanded ? "+" : "−";
    });
  });

  // Memo textarea with localStorage
  const memo = document.getElementById("free-memo");
  const memoClear = document.getElementById("memo-clear");
  const MEMO_KEY = "insu-portfolio-memo";
  if (memo) {
    try {
      const saved = localStorage.getItem(MEMO_KEY);
      if (saved) memo.value = saved;
    } catch (e) {}

    memo.addEventListener("input", () => {
      try {
        localStorage.setItem(MEMO_KEY, memo.value);
      } catch (e) {}
    });
  }
  if (memoClear && memo) {
    memoClear.addEventListener("click", () => {
      memo.value = "";
      try {
        localStorage.setItem(MEMO_KEY, "");
      } catch (e) {}
    });
  }

  // Lightbox
  const lightbox = document.getElementById("lightbox");
  const openShot = document.getElementById("tablet-shot-open");
  const closeShot = document.getElementById("lightbox-close");

  const openLightbox = () => {
    if (lightbox) lightbox.hidden = false;
    if (closeShot) closeShot.focus();
  };
  const closeLightbox = () => {
    if (lightbox) lightbox.hidden = true;
    if (openShot) openShot.focus();
  };

  if (openShot) openShot.addEventListener("click", openLightbox);
  if (closeShot) closeShot.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox();
  });
});
