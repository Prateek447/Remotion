import type { ThemedToken, HighlighterGeneric } from "shiki";

export interface KeyedToken {
  key: string;
  content: string;
  offset: number;
  color?: string;
  fontStyle?: number;
}

export interface KeyedTokensInfo {
  code: string;
  hash: string;
  tokens: KeyedToken[];
  bg?: string;
  fg?: string;
  lang?: string;
}

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return "h" + Math.abs(h).toString(36);
}

interface LCSMatch {
  fromStart: number;
  toStart: number;
  length: number;
}

function findCommonSubstrings(a: string, b: string): LCSMatch[] {
  const matches: LCSMatch[] = [];
  const minLen = 3;

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      const start_i = i;
      const start_j = j;
      while (i < a.length && j < b.length && a[i] === b[j]) {
        i++;
        j++;
      }
      if (i - start_i >= minLen) {
        matches.push({ fromStart: start_i, toStart: start_j, length: i - start_i });
      }
    } else {
      const aheadInB = b.indexOf(a[i], j);
      const aheadInA = a.indexOf(b[j], i);

      if (aheadInB === -1 && aheadInA === -1) {
        i++;
        j++;
      } else if (aheadInB === -1) {
        j++;
      } else if (aheadInA === -1) {
        i++;
      } else if (aheadInB - j <= aheadInA - i) {
        j = aheadInB;
      } else {
        i = aheadInA;
      }
    }
  }

  return matches;
}

function splitWhitespaceTokens(tokens: ThemedToken[][]) {
  return tokens.map((line) =>
    line.flatMap((token) => {
      if (token.content.match(/^\s+$/)) return token;
      const match = token.content.match(/^(\s*)(.*?)(\s*)$/);
      if (!match) return token;
      const [, leading, content, trailing] = match;
      if (!leading && !trailing) return token;

      const expanded: ThemedToken[] = [
        { ...token, offset: token.offset + leading.length, content },
      ];
      if (leading) {
        expanded.unshift({ content: leading, offset: token.offset } as ThemedToken);
      }
      if (trailing) {
        expanded.push({
          content: trailing,
          offset: token.offset + leading.length + content.length,
        } as ThemedToken);
      }
      return expanded;
    }),
  );
}

function toKeyedTokens(code: string, tokens: ThemedToken[][], salt = ""): KeyedTokensInfo {
  const hsh = simpleHash(code + salt);
  let lastOffset = 0;
  let globalCounter = 0;

  const keyed = splitWhitespaceTokens(tokens)
    .flatMap((line): KeyedToken[] => {
      const lastEl = line[line.length - 1];
      if (!lastEl) lastOffset += 1;
      else lastOffset = lastEl.offset + lastEl.content.length;

      const lineTokens = line.map((t) => {
        const k: KeyedToken = {
          content: t.content,
          offset: t.offset,
          color: t.color,
          fontStyle: t.fontStyle,
          key: `${hsh}-${globalCounter++}`,
        };
        return k;
      });

      lineTokens.push({
        content: "\n",
        offset: lastOffset,
        key: `${hsh}-${globalCounter++}`,
      } as KeyedToken);

      return lineTokens;
    });

  return { code, hash: hsh, tokens: keyed };
}

export function codeToKeyedTokens(
  highlighter: HighlighterGeneric<any, any>,
  code: string,
  options: { lang: string; theme: string },
): KeyedTokensInfo {
  const result = highlighter.codeToTokens(code, { lang: options.lang, theme: options.theme });
  const info = toKeyedTokens(code, result.tokens, JSON.stringify([options.lang, options.theme]));
  info.bg = result.bg;
  info.fg = result.fg;
  info.lang = options.lang;
  return info;
}

export function syncTokenKeys(
  from: KeyedTokensInfo,
  to: KeyedTokensInfo,
): { from: KeyedTokensInfo; to: KeyedTokensInfo } {
  const matches = findCommonSubstrings(from.code, to.code);

  const tokensFrom = [...from.tokens];
  const tokensTo = [...to.tokens];
  const matchedKeys = new Set<string>();

  for (const match of matches) {
    const fromEnd = match.fromStart + match.length;
    const toEnd = match.toStart + match.length;

    const tFrom = tokensFrom.filter(
      (t) => t.offset >= match.fromStart && t.offset + t.content.length <= fromEnd,
    );
    const tTo = tokensTo.filter(
      (t) => t.offset >= match.toStart && t.offset + t.content.length <= toEnd,
    );

    let fi = 0;
    let ti = 0;
    while (fi < tFrom.length && ti < tTo.length) {
      if (tFrom[fi].content === tTo[ti].content) {
        tTo[ti].key = tFrom[fi].key;
        matchedKeys.add(tFrom[fi].key);
        fi++;
        ti++;
      } else if (tFrom[fi + 1]?.content === tTo[ti].content) {
        fi++;
      } else if (tFrom[fi].content === tTo[ti + 1]?.content) {
        ti++;
      } else {
        fi++;
        ti++;
      }
    }
  }

  for (const token of tokensFrom) {
    if (matchedKeys.has(token.key)) continue;
    if (token.content.length < 3 || !token.content.match(/^[\w-]+$/)) continue;
    const matched = tokensTo.find(
      (t) => t.content === token.content && !matchedKeys.has(t.key),
    );
    if (matched) {
      matched.key = token.key;
      matchedKeys.add(token.key);
    }
  }

  return {
    from: { ...from, tokens: tokensFrom },
    to: { ...to, tokens: tokensTo },
  };
}
