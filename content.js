const ICON_URL = chrome.runtime.getURL("icons/ssrn.svg");
const STYLE_ID = "ssrn-link-style";
const PROCESSED_ATTR = "data-ssrn-processed";
const CLASS_NAME = "ssrn-link-icon";
const SETTINGS = { enabled: true };
let isEnabled = false;
let observer = null;

const SELECTORS = [
  "h1.article-title",
  "h1.c-article-title",
  "h1.citation__title",
  "h1.title",
  "h2.article-title",
  "h2.citation__title",
  "h2.issue-item__title",
  "h3.issue-item__title",
  "h4.issue-item__title",
  ".article-title",
  ".citation__title",
  ".c-article-title",
  ".hlFld-Title",
  ".meta__title",
  ".issue-item__title",
  ".result-list-title",
  ".result-list-title-link",
  ".article-title__text",
  "a.result-list-title-link",
  "a.issue-item__title",
  "a.article-title",
  "a.citation__title",
  "a.c-article-title",
  "a.title",
  "span.article-title",
  "span.citation__title",
  "span.issue-item__title",
  "span.result-list-title"
];

const CLASS_HINTS = ["title", "article", "citation", "issue-item"];

init();

function init() {
  ensureStyles();
  chrome.storage.local.get(SETTINGS, (config) => {
    if (config.enabled) {
      enable();
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !Object.prototype.hasOwnProperty.call(changes, "enabled")) {
      return;
    }

    if (changes.enabled.newValue) {
      enable();
    } else {
      disable();
    }
  });
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .${CLASS_NAME} {
      display: inline-flex;
      align-items: center;
      margin-left: 6px;
      text-decoration: none;
      vertical-align: middle;
    }
    .${CLASS_NAME} img {
      width: 14px;
      height: 14px;
    }
    .${CLASS_NAME}[data-loading="1"] img {
      opacity: 0.6;
      filter: grayscale(1);
    }
  `;
  const target = document.head || document.documentElement;
  if (!target) {
    return;
  }
  target.appendChild(style);
}

function enable() {
  if (isEnabled) {
    return;
  }

  isEnabled = true;
  ensureStyles();
  scanAndInject(document);
  observer = observeForChanges();
}

function disable() {
  if (!isEnabled) {
    return;
  }

  isEnabled = false;
  clearInjected();
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function scanAndInject(root) {
  const candidates = new Set();

  SELECTORS.forEach((selector) => {
    root.querySelectorAll(selector).forEach((node) => candidates.add(node));
  });

  root.querySelectorAll("h1, h2, h3, h4, a, span").forEach((node) => {
    const className = String(node.className || "").toLowerCase();
    if (CLASS_HINTS.some((hint) => className.includes(hint))) {
      candidates.add(node);
    }
  });

  candidates.forEach((node) => {
    if (!isValidTitleNode(node)) {
      return;
    }
    injectIcon(node);
  });
}

function isValidTitleNode(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }
  if (node.getAttribute(PROCESSED_ATTR) === "1") {
    return false;
  }

  const text = getTitleText(node);
  if (text.length < 8 || text.length > 300) {
    return false;
  }

  const rects = node.getClientRects();
  if (!rects || rects.length === 0) {
    return false;
  }

  return true;
}

function getTitleText(node) {
  return String(node.innerText || node.textContent || "").replace(/\s+/g, " ").trim();
}

function injectIcon(node) {
  node.setAttribute(PROCESSED_ATTR, "1");
  const title = getTitleText(node);
  if (!title) {
    return;
  }

  const link = document.createElement("a");
  link.className = CLASS_NAME;
  link.href = buildSearchUrl(title);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.title = "Open SSRN working paper";

  const img = document.createElement("img");
  img.src = ICON_URL;
  img.alt = "SSRN";
  link.appendChild(img);

  if (node.tagName === "A") {
    node.insertAdjacentElement("afterend", link);
  } else {
    node.appendChild(link);
  }
}

function buildSearchUrl(title) {
  const primaryQuery = buildSearchQuery(title);
  const queryParam = encodeURIComponent(primaryQuery);
  return `https://papers.ssrn.com/searchresults.cfm?term=${queryParam}`;
}

function buildSearchQuery(title) {
  const trimmed = String(title || "").replace(/\s+/g, " ").trim();
  const tokens = trimmed.split(" ").filter(Boolean);
  if (!tokens.length) {
    return "";
  }
  return tokens.join(" ");
}

function observeForChanges() {
  if (!document.body) {
    return null;
  }
  const activeObserver = new MutationObserver((mutations) => {
    if (!isEnabled) {
      return;
    }

    let shouldScan = false;

    mutations.forEach((mutation) => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        shouldScan = true;
      }
    });

    if (shouldScan) {
      scanAndInject(document);
    }
  });

  activeObserver.observe(document.body, { childList: true, subtree: true });
  return activeObserver;
}

function clearInjected() {
  document.querySelectorAll(`.${CLASS_NAME}`).forEach((node) => {
    node.remove();
  });

  document.querySelectorAll(`[${PROCESSED_ATTR}="1"]`).forEach((node) => {
    node.removeAttribute(PROCESSED_ATTR);
  });
}
