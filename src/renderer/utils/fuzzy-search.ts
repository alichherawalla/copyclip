// Fuzzy search utility for the renderer process
// This is a client-side version that can be used for highlighting

export interface FuzzyMatchResult {
  score: number;
  matches: Array<[number, number]>;
}

export function fuzzyMatch(pattern: string, text: string): FuzzyMatchResult | null {
  if (!pattern || !text) {
    return null;
  }

  const patternLower = pattern.toLowerCase();
  const textLower = text.toLowerCase();

  // Quick check: all pattern characters must exist in text
  let patternIndex = 0;
  for (let i = 0; i < textLower.length && patternIndex < patternLower.length; i++) {
    if (textLower[i] === patternLower[patternIndex]) {
      patternIndex++;
    }
  }

  if (patternIndex !== patternLower.length) {
    return null;
  }

  // Find matches and calculate score
  const matches: number[] = [];
  let score = 0;
  patternIndex = 0;
  let consecutiveBonus = 0;

  for (let textIdx = 0; textIdx < text.length && patternIndex < pattern.length; textIdx++) {
    if (textLower[textIdx] === patternLower[patternIndex]) {
      matches.push(textIdx);

      let matchScore = 1;

      // Consecutive match bonus
      if (matches.length > 1 && matches[matches.length - 1] === matches[matches.length - 2] + 1) {
        consecutiveBonus++;
        matchScore += consecutiveBonus * 2;
      } else {
        consecutiveBonus = 0;
      }

      // Word boundary bonus
      if (textIdx === 0 || isWordBoundary(text[textIdx - 1])) {
        matchScore += 5;
      }

      // Start bonus
      if (textIdx === 0) {
        matchScore += 10;
      }

      score += matchScore;
      patternIndex++;
    }
  }

  if (patternIndex !== pattern.length) {
    return null;
  }

  const unmatchedPenalty = (text.length - matches.length) * 0.1;
  score = Math.max(0, score - unmatchedPenalty) / pattern.length;

  return { score, matches: indicesToRanges(matches) };
}

function isWordBoundary(char: string): boolean {
  return /[\s\-_.,;:!?()[\]{}'"\/\\]/.test(char);
}

function indicesToRanges(indices: number[]): Array<[number, number]> {
  if (indices.length === 0) return [];

  const ranges: Array<[number, number]> = [];
  let start = indices[0];
  let end = indices[0];

  for (let i = 1; i < indices.length; i++) {
    if (indices[i] === end + 1) {
      end = indices[i];
    } else {
      ranges.push([start, end + 1]);
      start = indices[i];
      end = indices[i];
    }
  }

  ranges.push([start, end + 1]);
  return ranges;
}
