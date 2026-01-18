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
const MATCH_THRESHOLD = 1.6;
const MAX_ATTEMPTS = 6;
const RETRY_DELAY_MS = 500;

const targetTitle = resolveTargetTitle();
if (targetTitle) {
  attemptRedirect(1);
}

function resolveTargetTitle() {
  const term = getSearchParam("term");
  const fallback = getSearchParam("txtKey_Words");
  const resolved = term || fallback || "";
  return String(resolved).replace(/\s+/g, " ").trim();
}

function attemptRedirect(attempt) {
  const results = collectResults();
  if (results.length) {
    const best = pickBestMatch(results, targetTitle);
    if (results.length === 1 && results[0].url) {
      window.location.replace(results[0].url);
      return;
    }
    if (best && best.score >= MATCH_THRESHOLD && best.coverage >= 0.8) {
      window.location.replace(best.url);
      return;
    }
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
