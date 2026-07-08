import compiler from "./compiler.js";
import parser from "./parser.js";

export function wordsToNumbers(text, options = {}) {
  const regions = parser(text, options);
  if (!regions.length) return text;
  const compiled = compiler({ text, regions });
  return compiled;
}

export default wordsToNumbers;
