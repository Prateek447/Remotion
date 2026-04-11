import { createHighlighter, type ThemedToken, type HighlighterGeneric } from "shiki";
import { codeToKeyedTokens, syncTokenKeys, type KeyedTokensInfo } from "./magic-move";

let highlighter: HighlighterGeneric<any, any> | null = null;

export async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ["one-dark-pro"],
      langs: ["java"],
    });
  }
  return highlighter;
}

export async function highlightCode(
  code: string,
  lang: string = "java",
  theme: string = "one-dark-pro"
): Promise<ThemedToken[][]> {
  const hl = await getHighlighter();
  const result = hl.codeToTokens(code, { lang, theme });
  return result.tokens;
}

export async function computeKeyedTokens(
  code: string,
  lang: string = "java",
  theme: string = "one-dark-pro"
): Promise<KeyedTokensInfo> {
  const hl = await getHighlighter();
  return codeToKeyedTokens(hl, code, { lang, theme });
}

export function computeTransitionPair(
  from: KeyedTokensInfo,
  to: KeyedTokensInfo,
): { from: KeyedTokensInfo; to: KeyedTokensInfo } {
  return syncTokenKeys(from, to);
}

export type { KeyedTokensInfo };
