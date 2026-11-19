// XML pretty-printer / minifier built on the browser's own XML parser (also validates).

const escapeText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function parse(source: string): Document {
  const doc = new DOMParser().parseFromString(source, 'application/xml');
  const error = doc.getElementsByTagName('parsererror')[0];
  if (error) {
    // Chromium wraps the message in a <div>; Firefox puts it in the element's text.
    const message = (error.querySelector('div')?.textContent ?? error.textContent ?? 'Invalid XML').trim();
    throw new Error(message.split('\n')[0].replace(/^This page contains the following errors:\s*/, ''));
  }
  return doc;
}

export function formatXml(source: string, mode: 'format' | 'minify', indentUnit = '  '): string {
  const doc = parse(source);
  const pretty = mode === 'format';
  const nl = pretty ? '\n' : '';
  const lines: string[] = [];

  // The XML declaration and DOCTYPE (with any internal subset) are not fully kept in the DOM, so copy them from the source.
  const declaration = /^\s*(<\?xml[\s\S]*?\?>)/.exec(source)?.[1];
  if (declaration) lines.push(declaration);
  const doctype = /<!DOCTYPE[^>[]*(\[[\s\S]*?\])?\s*>/i.exec(source)?.[0];

  const serialize = (node: Node, depth: number): string => {
    const pad = pretty ? indentUnit.repeat(depth) : '';
    switch (node.nodeType) {
      case Node.ELEMENT_NODE: {
        const el = node as Element;
        const attrs = Array.from(el.attributes, (a) => ` ${a.name}="${escapeAttr(a.value)}"`).join('');
        const children = Array.from(el.childNodes).filter(
          (c) => !(c.nodeType === Node.TEXT_NODE && !c.textContent!.trim()),
        );
        if (!children.length) return `${pad}<${el.nodeName}${attrs}/>`;
        // Text-only elements stay on one line: <name>value</name>.
        if (children.every((c) => c.nodeType === Node.TEXT_NODE || c.nodeType === Node.CDATA_SECTION_NODE)) {
          const inner = children.map((c) => serialize(c, 0).trim()).join('');
          return `${pad}<${el.nodeName}${attrs}>${inner}</${el.nodeName}>`;
        }
        const inner = children.map((c) => serialize(c, depth + 1)).join(nl);
        return `${pad}<${el.nodeName}${attrs}>${nl}${inner}${nl}${pad}</${el.nodeName}>`;
      }
      case Node.TEXT_NODE:
        return pad + escapeText(pretty ? node.textContent!.trim() : node.textContent!);
      case Node.CDATA_SECTION_NODE:
        return `${pad}<![CDATA[${node.textContent}]]>`;
      case Node.COMMENT_NODE:
        return `${pad}<!--${node.textContent}-->`;
      case Node.PROCESSING_INSTRUCTION_NODE: {
        const pi = node as ProcessingInstruction;
        return `${pad}<?${pi.target} ${pi.data}?>`;
      }
      case Node.DOCUMENT_TYPE_NODE:
        return doctype ?? `<!DOCTYPE ${(node as DocumentType).name}>`;
      default:
        return '';
    }
  };

  for (const child of Array.from(doc.childNodes)) lines.push(serialize(child, 0));
  return lines.filter(Boolean).join(nl);
}
