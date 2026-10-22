/**
 * Make Markdown written for plain Markdown safe to compile as MDX.
 *
 * Escapes `<`, `{` and `}` outside fenced blocks and inline code spans, where
 * MDX would otherwise open a tag or an expression. A `>` is plain text to MDX,
 * and escaping it would break blockquotes, so it stays.
 *
 * Shared by the generators: CHANGELOG.md predates MDX, and JSDoc prose is full
 * of `{ … }` and `<T>`. MDX matters even for plain pages, because
 * starlight-versions parses every page as MDX when it snapshots a version.
 *
 * @param {string} markdown
 * @returns {string}
 */
export function escapeMdx(markdown) {
  let fenced = false;

  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fenced = !fenced;
        return line;
      }

      if (fenced) return line;

      // Odd pieces are code spans; leave them as written.
      return line
        .split(/(`+[^`]*`+)/)
        .map((piece, i) => (i % 2 ? piece : piece.replace(/</g, '&lt;').replace(/[{}]/g, (brace) => `\\${brace}`)))
        .join('');
    })
    .join('\n');
}
