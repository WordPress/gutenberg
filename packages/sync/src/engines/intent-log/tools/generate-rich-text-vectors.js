/**
 * Generates frozen cross-language rich-text codec vectors.
 *
 *   node tools/generate-rich-text-vectors.js > test-vectors/rich-text.json
 *
 * Each html case records htmlToField()'s output and its serialization; each
 * field case records fieldToHtml() and the reparse (span normalization).
 * The PHP twin (WP_Intent_Log_Rich_Text) must reproduce every entry —
 * the codec defines THE text coordinate space, so any divergence between
 * client capture and server genesis/materialization desynchronizes offsets.
 *
 * Regenerate only alongside a deliberate, versioned codec change, in both
 * languages together.
 */

import { fieldToHtml, htmlToField } from '../rich-text.js';

const HTML_CASES = [
	'',
	'Hello world',
	'a &amp; b &lt;c&gt; &quot;d&quot; &apos;e&apos;',
	'num &#233; hex &#xE9; astral &#x1F600;',
	'nb&nbsp;sp',
	'a <em>b</em> c',
	'<strong><em>nested</em></strong> tail',
	'<em>touching</em><strong>spans</strong>',
	'<a href="https://example.test/?a=1&amp;b=2" rel="nofollow">link</a>',
	'<code>if (a &lt; b) {}</code>',
	'line one<br>line two<br/>line three',
	'ca<em>fé 你好</em> niño',
	'<em>你好<strong>世界</strong></em>',
	'x <img src="i.png" alt="&amp;"> y',
	'<figure><img src="i.png"><figcaption>cap</figcaption></figure>',
	'a<!-- comment -->b',
	'<s>strike</s> <sub>sub</sub> <sup>sup</sup> <kbd>K</kbd> <mark>hi</mark>',
	'<span class="x" data-v="1">styled</span>',
	// Unsupported inputs: whole-field objects, round-trip exact.
	'<em>unclosed',
	'mismatched </strong>',
	'entity &hellip; unknown',
	'stray < bracket',
	'<div>block-level content</div> tail',
];

const FIELD_CASES = [
	{
		text: 'abcd',
		formats: [
			{ start: 0, end: 3, format: 'em' },
			{ start: 2, end: 4, format: 'strong' },
		],
	},
	{
		text: 'overlap three',
		formats: [
			{ start: 0, end: 9, format: 'em' },
			{ start: 4, end: 13, format: 'strong' },
			{ start: 6, end: 8, format: 's' },
		],
	},
	{
		text: 'same range ties',
		formats: [
			{ start: 0, end: 4, format: 'strong' },
			{ start: 0, end: 4, format: 'em' },
		],
	},
	{
		text: 'a & < > " née',
		formats: [ { start: 2, end: 7, format: 'code' } ],
	},
	{
		text: 'x\ny',
		formats: [ { start: 0, end: 3, format: 'em' } ],
	},
];

const cases = {
	html: HTML_CASES.map( ( html ) => {
		const field = htmlToField( html );
		return { html, field, serialized: fieldToHtml( field ) };
	} ),
	field: FIELD_CASES.map( ( field ) => {
		const serialized = fieldToHtml( field );
		return { field, serialized, reparsed: htmlToField( serialized ) };
	} ),
};

process.stdout.write(
	JSON.stringify(
		{
			description:
				'Frozen rich-text codec vectors: html→field (htmlToField), field→html (fieldToHtml), and reparse normalization. The PHP twin must reproduce every entry byte-for-byte. Regenerate with tools/generate-rich-text-vectors.js only alongside a deliberate codec change, in both languages together.',
			cases,
		},
		null,
		'\t'
	) + '\n'
);
