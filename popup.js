const SETTINGS = { enabled: true };
const statusEl = document.getElementById("status");
const onButton = document.getElementById("on");
const offButton = document.getElementById("off");

chrome.storage.local.get(SETTINGS, (config) => {
  updateUI(config.enabled);
});

onButton.addEventListener("click", () => {
  setEnabled(true);
});

offButton.addEventListener("click", () => {
  setEnabled(false);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !Object.prototype.hasOwnProperty.call(changes, "enabled")) {
    return;
  }
  updateUI(changes.enabled.newValue);
});

function setEnabled(enabled) {
  chrome.storage.local.set({ enabled });
  updateUI(enabled);
}

function updateUI(enabled) {
  statusEl.textContent = `Status: ${enabled ? "On" : "Off"}`;
  onButton.classList.toggle("active", enabled);
  offButton.classList.toggle("active", !enabled);
}
