const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "of",
  "in",
  "on",
  "a",
  "an",
  "to",
  "with",
  "from",
  "by",
  "is",
  "are",
  "be",
  "as",
  "at",
  "or",
  "we",
  "our",
  "their"
]);
const MATCH_THRESHOLD = 0.62;
const MAX_ATTEMPTS = 20;
const RETRY_DELAY_MS = 500;
const SUBMIT_MARKER_KEY = "ssrn-quick-jump-submit-state";
const MAX_SUBMIT_ATTEMPTS = 4;
const SUBMIT_RETRY_COOLDOWN_MS = 700;
const HARD_REDIRECT_AFTER_SUBMITS = 2;

let targetTitle = resolveTargetTitle();
attemptRedirect(1);

function getSearchInputElement() {
  const scopedInput = document.querySelector(
    '#search-results #term, #search-results input[aria-label="Search term(s)"]'
  );
  if (scopedInput) {
    return scopedInput;
  }

  return (
    document.querySelector('input[name="txtKey_Words"]') ||
    document.querySelector('#txtKey_Words') ||
    document.querySelector('#term') ||
    document.querySelector('input[aria-label="Search term(s)"]') ||
    document.querySelector('input[type="search"]') ||
    document.querySelector('input[name="q"]') ||
    document.querySelector('input[type="text"]')
  );
}

function resolveTargetTitle() {
  const txtKeywords = getSearchParam("txtKey_Words");
  const term = getSearchParam("term");
  const query = getSearchParam("q");
  const hashQuery = getHashParam("ssrnq");
  const resolved = txtKeywords || term || query || hashQuery || "";
  return String(resolved).replace(/\s+/g, " ").trim();
}

function resolveTargetTitleFromDom() {
  const input = getSearchInputElement();

  if (!input) {
    return "";
  }

  const value = input.value || input.getAttribute("value") || "";
  return String(value).replace(/\s+/g, " ").trim();
}

function attemptRedirect(attempt) {
  if (!targetTitle) {
    targetTitle = resolveTargetTitleFromDom();
  }

  const results = collectResults();
  if (results.length) {
    const best = pickBestMatch(results, targetTitle);
    if (results.length === 1 && results[0].url) {
      window.location.replace(results[0].url);
      return;
    }
    if (best && best.score >= MATCH_THRESHOLD && best.coverage >= 0.55) {
      window.location.replace(best.url);
      return;
    }
  }

  if (targetTitle) {
    ensureSearchSubmitted(targetTitle);
  }

  if (attempt < MAX_ATTEMPTS) {
    window.setTimeout(() => attemptRedirect(attempt + 1), RETRY_DELAY_MS);
  }
}

function ensureSearchSubmitted(target) {
  const query = String(target || "").replace(/\s+/g, " ").trim();
  if (!query) {
    return false;
  }

  const submitState = getSubmitState();
  if (
    submitState.query === query &&
    submitState.count >= MAX_SUBMIT_ATTEMPTS
  ) {
    return false;
  }

  if (
    submitState.query === query &&
    Date.now() - submitState.lastTs < SUBMIT_RETRY_COOLDOWN_MS
  ) {
    return false;
  }

  const input = getSearchInputElement();

  if (!input) {
    return false;
  }

  if (String(input.value || "").replace(/\s+/g, " ").trim() !== query) {
    setInputValue(input, query);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const nextSubmitCount =
    submitState.query === query ? submitState.count + 1 : 1;

  setSubmitState({
    query,
    count: nextSubmitCount,
    lastTs: Date.now()
  });

  const form =
    input.form ||
    document.querySelector('form[action*="results.cfm"]') ||
    document.querySelector("form");

  const explicitSubmitButton =
    form?.querySelector('button[type="submit"]') ||
    form?.querySelector('input[type="submit"]');

  const advancedSearchButton = document.querySelector(
    '#search-results button[aria-label="Search"]'
  );

  const localSearchButton =
    input.parentElement?.querySelector('button[aria-label*="search" i]') ||
    input.parentElement?.querySelector('button') ||
    input.closest("div")?.querySelector('button[aria-label*="search" i]') ||
    input.closest("div")?.querySelector('button');

  const nearbySearchButton =
    advancedSearchButton ||
    localSearchButton ||
    document.querySelector('button[aria-label*="search" i]') ||
    document.querySelector('button[class*="search" i]') ||
    input.nextElementSibling;

  if (explicitSubmitButton && typeof explicitSubmitButton.click === "function") {
    explicitSubmitButton.click();
    return true;
  }

  if (nearbySearchButton && typeof nearbySearchButton.click === "function") {
    nearbySearchButton.click();
    return true;
  }

  input.focus();
  input.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
  );
  input.dispatchEvent(
    new KeyboardEvent("keypress", { key: "Enter", bubbles: true })
  );
  input.dispatchEvent(
    new KeyboardEvent("keyup", { key: "Enter", bubbles: true })
  );

  if (!form) {
    if (nextSubmitCount >= HARD_REDIRECT_AFTER_SUBMITS) {
      hardRedirectToResults(query);
    }
    return true;
  }

  if (typeof form.requestSubmit === "function") {
    form.requestSubmit();
  } else {
    form.submit();
  }

  if (nextSubmitCount >= HARD_REDIRECT_AFTER_SUBMITS) {
    window.setTimeout(() => hardRedirectToResults(query), 400);
  }
  return true;
}

function setInputValue(input, value) {
  const descriptor = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  );
  if (descriptor && typeof descriptor.set === "function") {
    descriptor.set.call(input, value);
  } else {
    input.value = value;
  }
}

function hardRedirectToResults(query) {
  const normalized = String(query || "").trim();
  if (!normalized) {
    return;
  }

  const targetUrl = `https://papers.ssrn.com/searchresults.cfm?term=${encodeURIComponent(
    normalized
  )}`;
  if (window.location.href !== targetUrl) {
    window.location.replace(targetUrl);
  }
}

function getSubmitState() {
  const raw = window.sessionStorage.getItem(SUBMIT_MARKER_KEY);
  if (!raw) {
    return { query: "", count: 0, lastTs: 0 };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      query: String(parsed.query || ""),
      count: Number(parsed.count || 0),
      lastTs: Number(parsed.lastTs || 0)
    };
  } catch (error) {
    return { query: "", count: 0, lastTs: 0 };
  }
}

function setSubmitState(state) {
  window.sessionStorage.setItem(SUBMIT_MARKER_KEY, JSON.stringify(state));
}

function collectResults() {
  const anchors = Array.from(
    document.querySelectorAll('a[href*="abstract_id="]')
  );
  const results = [];
  const seen = new Set();

  anchors.forEach((anchor) => {
    const text = String(anchor.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length < 6) {
      return;
    }

    let href = anchor.getAttribute("href") || "";
    if (!href) {
      return;
    }

    if (href.startsWith("/")) {
      href = `https://papers.ssrn.com${href}`;
    } else if (!href.startsWith("http")) {
      return;
    }

    if (seen.has(href)) {
      return;
    }
    seen.add(href);
    results.push({ title: text, url: href });
  });

  return results;
}

function pickBestMatch(results, target) {
  if (!results.length || !target) {
    return null;
  }

  const targetTokens = tokenize(target);
  const targetNormalized = normalizeText(target);
  let best = null;
  let bestScore = 0;

  results.forEach((result) => {
    const resultTokens = tokenize(result.title);
    const intersection = countIntersection(targetTokens, resultTokens);
    const coverage = targetTokens.length ? intersection / targetTokens.length : 0;
    const jaccardScore = jaccardFromIntersection(
      intersection,
      targetTokens.length,
      resultTokens.length
    );
    const phraseHit =
      targetNormalized && normalizeText(result.title).includes(targetNormalized)
        ? 1
        : 0;
    const score = phraseHit * 1.5 + coverage + jaccardScore;
    if (score > bestScore) {
      bestScore = score;
      best = { ...result, score, coverage };
    }
  });

  return best;
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalizeText(text)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function getSearchParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function getHashParam(name) {
  const hash = String(window.location.hash || "").replace(/^#/, "");
  if (!hash) {
    return "";
  }

  const params = new URLSearchParams(hash);
  return params.get(name);
}

function countIntersection(aTokens, bTokens) {
  if (!aTokens.length || !bTokens.length) {
    return 0;
  }
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  let intersection = 0;
  aSet.forEach((token) => {
    if (bSet.has(token)) {
      intersection += 1;
    }
  });
  return intersection;
}

function jaccardFromIntersection(intersection, aSize, bSize) {
  if (!intersection || !aSize || !bSize) {
    return 0;
  }
  const union = aSize + bSize - intersection;
  return union === 0 ? 0 : intersection / union;
}
