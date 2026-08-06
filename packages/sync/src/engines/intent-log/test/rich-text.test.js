/**
 * Rich-text codec: inline HTML ↔ { text, formats }. The plain-text side of
 * every field is THE text coordinate space (UTF-16 code units), so these
 * conversions are contract, twin-implemented in PHP and vector-frozen.
 */

import assert from 'node:assert/strict';

import {
	decodeFormat,
	encodeFormat,
	fieldToHtml,
	htmlToField,
} from '../rich-text.js';

const OBJ = '￼';

describe( 'rich-text codec', () => {
	it( 'plain text passes through; entities decode; offsets are code units', () => {
		assert.deepEqual( htmlToField( 'Hello world' ), {
			text: 'Hello world',
			formats: [],
		} );
		assert.deepEqual( htmlToField( 'a &amp; b &lt;c&gt; &#233;é' ), {
			text: 'a & b <c> éé',
			formats: [],
		} );
		// Astral entity: 2 code units of text.
		const emoji = htmlToField( '&#x1F600;!' );
		assert.equal( emoji.text.length, 3 );
	} );

	it( 'format tags become spans with plain-text offsets (no tag characters)', () => {
		assert.deepEqual( htmlToField( 'a <em>b</em> c' ), {
			text: 'a b c',
			formats: [ { start: 2, end: 3, format: 'em' } ],
		} );
		assert.deepEqual( htmlToField( '<strong><em>hi</em></strong>' ), {
			text: 'hi',
			formats: [
				{ start: 0, end: 2, format: 'em' },
				{ start: 0, end: 2, format: 'strong' },
			],
		} );
	} );

	it( 'anchor attributes ride the format id, sorted and decoded', () => {
		const field = htmlToField(
			'<a rel="nofollow" href="https://x.test/?a=1&amp;b=2">go</a>'
		);
		assert.deepEqual( field.formats, [
			{
				start: 0,
				end: 2,
				format: 'a|{"href":"https://x.test/?a=1&b=2","rel":"nofollow"}',
			},
		] );
		assert.deepEqual( decodeFormat( field.formats[ 0 ].format ), {
			tag: 'a',
			attrs: { href: 'https://x.test/?a=1&b=2', rel: 'nofollow' },
		} );
		assert.equal(
			encodeFormat( 'a', {
				rel: 'nofollow',
				href: 'https://x.test/?a=1&b=2',
			} ),
			field.formats[ 0 ].format
		);
	} );

	it( '<br> is a newline character both ways', () => {
		assert.deepEqual( htmlToField( 'a<br>b<br/>c' ), {
			text: 'a\nb\nc',
			formats: [],
		} );
		assert.equal( fieldToHtml( { text: 'a\nb', formats: [] } ), 'a<br>b' );
	} );

	it( 'opaque elements collapse to ONE object char preserving raw source', () => {
		const field = htmlToField( 'x <img src="i.png" alt="&amp;"> y' );
		assert.equal( field.text, `x ${ OBJ } y` );
		assert.deepEqual( field.formats, [
			{
				start: 2,
				end: 3,
				format: 'obj|{"html":"<img src=\\"i.png\\" alt=\\"&amp;\\">"}',
			},
		] );
		// Verbatim on the way back.
		assert.equal(
			fieldToHtml( field ),
			'x <img src="i.png" alt="&amp;"> y'
		);

		// Nested opaque elements are captured balanced, as one unit.
		const nested = htmlToField(
			'<figure><img src="i.png"><figcaption>hi</figcaption></figure>'
		);
		assert.equal( nested.text, OBJ );
		assert.equal(
			fieldToHtml( nested ),
			'<figure><img src="i.png"><figcaption>hi</figcaption></figure>'
		);

		// Comments too.
		const comment = htmlToField( 'a<!-- note -->b' );
		assert.equal( comment.text, `a${ OBJ }b` );
		assert.equal( fieldToHtml( comment ), 'a<!-- note -->b' );
	} );

	it( 'unsupported input degrades to a WHOLE-FIELD object, round-trip exact', () => {
		for ( const html of [
			'<em>unclosed',
			'mismatched </em>',
			'entity &hellip; unknown',
			'stray < bracket',
		] ) {
			const field = htmlToField( html );
			assert.equal( field.text, OBJ, html );
			assert.equal( fieldToHtml( field ), html );
		}
		// Empty input is just empty, not an object.
		assert.deepEqual( htmlToField( '' ), { text: '', formats: [] } );
	} );

	it( 'multibyte text under formats keeps code-unit offsets', () => {
		const field = htmlToField( 'ca<em>fé 你好</em>!' );
		assert.deepEqual( field, {
			text: 'café 你好!',
			formats: [ { start: 2, end: 7, format: 'em' } ],
		} );
	} );

	it( 'serialization escapes text and attributes, and emits &nbsp;', () => {
		assert.equal(
			fieldToHtml( { text: 'a & <b> ', formats: [] } ),
			'a &amp; &lt;b&gt;&nbsp;'
		);
		assert.equal(
			fieldToHtml( {
				text: 'x',
				formats: [
					{
						start: 0,
						end: 1,
						format: 'a|{"href":"u?a=1&b=\\"q\\""}',
					},
				],
			} ),
			'<a href="u?a=1&amp;b=&quot;q&quot;">x</a>'
		);
	} );

	it( 'partially overlapping spans serialize well-formed via close/reopen', () => {
		const html = fieldToHtml( {
			text: 'abcd',
			formats: [
				{ start: 0, end: 3, format: 'em' },
				{ start: 2, end: 4, format: 'strong' },
			],
		} );
		assert.equal( html, '<em>ab<strong>c</strong></em><strong>d</strong>' );
		// Well-formed: reparses without falling back to an object field.
		const reparsed = htmlToField( html );
		assert.ok( ! reparsed.text.includes( OBJ ) );
		assert.equal( reparsed.text, 'abcd' );
	} );

	it( 'parse∘serialize is a fixpoint after one normalization', () => {
		const samples = [
			'plain',
			'a <em>b <strong>c</strong></em> d',
			'<a href="https://x.test/">link</a> tail',
			'nb&nbsp;sp &amp; café <code>x&lt;y</code>',
			'pre <img src="a.png"> post<br>line',
		];
		for ( const html of samples ) {
			const once = htmlToField( html );
			const twice = htmlToField( fieldToHtml( once ) );
			assert.deepEqual( twice, once, html );
		}
		// Overlap normalization: stable from the second pass on.
		const overlapping = {
			text: 'abcd',
			formats: [
				{ start: 0, end: 3, format: 'em' },
				{ start: 2, end: 4, format: 'strong' },
			],
		};
		const normalized = htmlToField( fieldToHtml( overlapping ) );
		const again = htmlToField( fieldToHtml( normalized ) );
		assert.deepEqual( again, normalized );
	} );
} );
