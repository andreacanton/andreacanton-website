const ENTITIES: Record<string, string> = { '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&amp;': '&' };
const decode = (s: string) => s.replace(/&(?:lt|gt|quot|amp|#39|#x27);/g, (e) => ENTITIES[e]);
const escape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const KEYWORDS =
  'const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|implements|interface|type|enum|import|export|from|as|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|void|null|undefined|true|false|this|readonly|public|private|protected|static|satisfies';

const TOKEN = new RegExp(
  [
    String.raw`(?<comment>\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))`,
    String.raw`(?<string>"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|\`(?:[^\`\\]|\\[\s\S])*\`?)`,
    String.raw`(?<number>\b(?:0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)n?\b)`,
    String.raw`(?<keyword>\b(?:${KEYWORDS})\b)`,
    String.raw`(?<call>[A-Za-z_$][\w$]*(?=\s*\())`,
    String.raw`(?<word>[A-Za-z_$][\w$]*)`,
  ].join('|'),
  'y',
);

function tokenize(code: string): string {
  let out = '';
  let plain = '';
  let i = 0;
  const flush = () => {
    out += escape(plain);
    plain = '';
  };
  while (i < code.length) {
    TOKEN.lastIndex = i;
    const m = TOKEN.exec(code);
    if (!m) {
      plain += code[i++];
      continue;
    }
    const kind = Object.entries(m.groups!).find(([, v]) => v !== undefined)![0];
    if (kind === 'word') plain += m[0];
    else {
      flush();
      out += `<span class="tok-${kind}">${escape(m[0])}</span>`;
    }
    i += m[0].length;
  }
  flush();
  return out;
}

const LANGS = new Set(['ts', 'typescript']);

export function highlight(html: string): string {
  return html.replace(
    /<pre><code(?: class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/g,
    (_, lang: string | undefined, body: string) => {
      const code = decode(body);
      const inner = lang && LANGS.has(lang.toLowerCase()) ? tokenize(code) : escape(code);
      const cls = lang ? ' class="language-' + lang + '"' : '';
      return `<pre><code${cls}>${inner}</code></pre>`;
    },
  );
}
