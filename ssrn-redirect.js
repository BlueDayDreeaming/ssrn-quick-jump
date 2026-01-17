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
const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 400;

const targetTitle = resolveTargetTitle();
if (targetTitle) {
  attemptRedirect(1);
}

function resolveTargetTitle() {
  const params = new URLSearchParams(window.location.search);
  const direct = params.get("ssrnTitle");
  const fallback = params.get("txtKey_Words");
  const resolved = direct || fallback || "";
  return String(resolved).replace(/\s+/g, " ").trim();
}

function attemptRedirect(attempt) {
  const results = collectResults();
  if (results.length) {
    const best = pickBestMatch(results, targetTitle);
    if (best && best.score >= MATCH_THRESHOLD) {
      window.location.replace(best.url);
    }
    return;
  }

  if (attempt < MAX_ATTEMPTS) {
    window.setTimeout(() => attemptRedirect(attempt + 1), RETRY_DELAY_MS);
  }
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
  let best = null;
  let bestScore = 0;

  results.forEach((result) => {
    const score = jaccard(targetTokens, tokenize(result.title));
    if (score > bestScore) {
      bestScore = score;
      best = { ...result, score };
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

function jaccard(aTokens, bTokens) {
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

  const union = aSet.size + bSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
