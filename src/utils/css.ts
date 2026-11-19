/**
 * Conservative CSS minifier: drops comments and collapses whitespace, but never touches
 * the inside of strings or url(), and keeps spaces that matter (descendant selectors, calc()).
 */
export function minifyCss(source: string): string {
  let out = '';
  let i = 0;
  let pendingSpace = false;
  let depth = 0;

  const emitSpace = () => {
    if (pendingSpace && out && !/[{};,>(\s]$/.test(out)) out += ' ';
    pendingSpace = false;
  };

  while (i < source.length) {
    const c = source[i];

    if (c === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      pendingSpace = true;
      continue;
    }

    if (c === '"' || c === "'") {
      emitSpace();
      let j = i + 1;
      while (j < source.length && source[j] !== c) j += source[j] === '\\' ? 2 : 1;
      out += source.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // Unquoted url(...) can contain characters we must not rewrite.
    if (/^url\(/i.test(source.slice(i, i + 4)) && !/["']/.test(source.slice(i + 4).trimStart()[0] ?? '')) {
      emitSpace();
      const end = source.indexOf(')', i);
      const stop = end === -1 ? source.length : end + 1;
      out += source.slice(i, stop);
      i = stop;
      continue;
    }

    if (/\s/.test(c)) {
      pendingSpace = true;
      i++;
      continue;
    }

    // Inside a block, "prop: value" needs no space after the colon. The space before it is kept:
    // in a selector nested in @media, ".a :hover" means something different from ".a:hover".
    if (c === ':' && depth > 0) {
      emitSpace();
      out += c;
      i++;
      while (/\s/.test(source[i] ?? '')) i++;
      continue;
    }

    if ('{};,>'.includes(c)) {
      if (c === '{') depth++;
      if (c === '}') depth = Math.max(0, depth - 1);
      // Spaces around these are never significant.
      out = out.replace(/ $/, '');
      pendingSpace = false;
      // A trailing semicolon before } is redundant.
      if (c === '}' && out.endsWith(';')) out = out.slice(0, -1);
      out += c;
      i++;
      continue;
    }

    emitSpace();
    out += c;
    i++;
  }
  return out.trim();
}
