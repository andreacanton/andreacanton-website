import { describe, expect, test } from 'bun:test';
import { highlight } from '../highlight.ts';

const block = (code: string, lang?: string) =>
  `<pre><code${lang ? ` class="language-${lang}"` : ''}>${code}</code></pre>`;

describe('highlight', () => {
  test('tokenizes TypeScript blocks', () => {
    const out = highlight(block('const n = add(1, "a"); // done', 'ts'));
    expect(out).toBe(
      block(
        '<span class="tok-keyword">const</span> n = <span class="tok-call">add</span>(<span class="tok-number">1</span>, ' +
          '<span class="tok-string">&quot;a&quot;</span>); <span class="tok-comment">// done</span>',
        'ts'
      )
    );
  });

  test('accepts "typescript" in any case', () => {
    expect(highlight(block('let', 'TypeScript'))).toContain(
      '<span class="tok-keyword">let</span>'
    );
  });

  test('does not match keywords inside identifiers', () => {
    expect(highlight(block('constant iffy', 'ts'))).toBe(
      block('constant iffy', 'ts')
    );
  });

  test('decodes entities before tokenizing and escapes the output', () => {
    const out = highlight(block('a &lt; b &amp;&amp; &#39;x&lt;y&#39;', 'ts'));
    expect(out).toBe(
      block(
        'a &lt; b &amp;&amp; <span class="tok-string">\'x&lt;y\'</span>',
        'ts'
      )
    );
  });

  test('handles block comments, template strings and numbers', () => {
    const out = highlight(block('/* a */ `t ${x}` 0xff 1_000 2.5e3 10n', 'ts'));
    expect(out).toContain('<span class="tok-comment">/* a */</span>');
    expect(out).toContain('<span class="tok-string">`t ${x}`</span>');
    for (const n of ['0xff', '1_000', '2.5e3', '10n'])
      expect(out).toContain(`<span class="tok-number">${n}</span>`);
  });

  test('tolerates unterminated strings and comments', () => {
    expect(highlight(block('"abc', 'ts'))).toBe(
      block('<span class="tok-string">&quot;abc</span>', 'ts')
    );
    expect(highlight(block('/* abc', 'ts'))).toBe(
      block('<span class="tok-comment">/* abc</span>', 'ts')
    );
  });

  test('leaves other languages untokenized but normalizes escaping', () => {
    expect(highlight(block('const x = &#x27;a&#x27;', 'bash'))).toBe(
      block("const x = 'a'", 'bash')
    );
    expect(highlight(block('&lt;b&gt;'))).toBe(block('&lt;b&gt;'));
  });

  test('handles multiple blocks and leaves the rest of the HTML alone', () => {
    const html = `<p>const</p>${block('let', 'ts')}<p>x</p>${block('let')}`;
    expect(highlight(html)).toBe(
      `<p>const</p>${block('<span class="tok-keyword">let</span>', 'ts')}<p>x</p>${block('let')}`
    );
  });
});
