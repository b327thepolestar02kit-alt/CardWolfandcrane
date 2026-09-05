/* CardWolf release/version guard. Loaded before app.js so the visible build
   number remains correct even if app.js encounters a runtime error. */
(() => {
  const expected = "v419";
  window.CARDWOLF_VERSION = expected;
  const setVersion = (value) => {
    document.querySelectorAll(".build-version").forEach((el) => {
      el.textContent = value;
      el.setAttribute("aria-label", `ゲームバージョン ${value}`);
    });
  };
  setVersion(expected);
  if (location.protocol === "file:") return;
  fetch(`version.json?v=${encodeURIComponent(expected)}`, { cache: "no-store" })
    .then((r) => r.ok ? r.json() : null)
    .then((data) => {
      if (!data || !data.version) return;
      setVersion(String(data.version));
      if (String(data.version) !== expected) {
        console.error(`CardWolf version mismatch: HTML=${expected}, version.json=${data.version}`);
        document.documentElement.dataset.cardwolfVersionMismatch = "true";
      }
    })
    .catch(() => {});
})();
