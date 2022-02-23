/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';

/**
 * WordPress dependencies
 */
import {
	createBlock,
	getBlockContent,
	pasteHandler,
	rawHandler,
	registerBlockType,
	serialize,
} from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

function readFile( filePath ) {
	return fs.existsSync( filePath )
		? fs.readFileSync( filePath, 'utf8' ).trim()
		: '';
}

describe( 'Blocks raw handling', () => {
	beforeAll( () => {
		// Load all hooks that modify blocks
		require( '../../packages/editor/src/hooks' );
		registerCoreBlocks();
		registerBlockType( 'test/gallery', {
			title: 'Test Gallery',
			category: 'text',
			attributes: {
				ids: {
					type: 'array',
					default: [],
				},
			},
			transforms: {
				from: [
					{
						type: 'shortcode',
						tag: 'gallery',
						isMatch( { named: { ids } } ) {
							return ids.indexOf( 42 ) > -1;
						},
						attributes: {
							ids: {
								type: 'array',
								shortcode: ( { named: { ids } } ) =>
									ids
										.split( ',' )
										.map( ( id ) => parseInt( id, 10 ) ),
							},
						},
						priority: 9,
					},
				],
			},
			save: () => null,
		} );

		registerBlockType( 'test/non-inline-block', {
			title: 'Test Non Inline Block',
			category: 'text',
			supports: {
				pasteTextInline: false,
			},
			transforms: {
				from: [
					{
						type: 'raw',
						isMatch: ( node ) => {
							return (
								'words to live by' === node.textContent.trim()
							);
						},
						transform: () => {
							return createBlock( 'core/embed', {
								url:
									'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
							} );
						},
					},
				],
			},
			save: () => null,
		} );

		registerBlockType( 'test/transform-to-multiple-blocks', {
			title: 'Test Transform to Multiple Blocks',
			category: 'text',
			transforms: {
				from: [
					{
						type: 'raw',
						isMatch: ( node ) => {
							return node.textContent
								.split( ' ' )
								.every( ( chunk ) => /^P\S+?/.test( chunk ) );
						},
						transform: ( node ) => {
							return node.textContent
								.split( ' ' )
								.map( ( chunk ) =>
									createBlock( 'core/paragraph', {
										content: chunk.substring( 1 ),
									} )
								);
						},
					},
				],
			},
			save: () => null,
		} );
	} );

	it( 'should filter inline content', () => {
		const filtered = pasteHandler( {
			HTML: '<h2><em>test</em></h2>',
			mode: 'INLINE',
		} );

		expect( filtered ).toBe( '<em>test</em>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should ignore Google Docs UID tag', () => {
		const filtered = pasteHandler( {
			HTML: '<b id="docs-internal-guid-0"><em>test</em></b>',
			mode: 'AUTO',
		} );

		expect( filtered ).toBe( '<em>test</em>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should ignore Google Docs UID tag in inline mode', () => {
		const filtered = pasteHandler( {
			HTML: '<b id="docs-internal-guid-0"><em>test</em></b>',
			mode: 'INLINE',
		} );

		expect( filtered ).toBe( '<em>test</em>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should paste special whitespace', () => {
		const filtered = pasteHandler( {
			HTML: '<p>&thinsp;</p>',
			plainText: ' ',
			mode: 'AUTO',
		} );

		expect( console ).toHaveLogged();
		expect( filtered ).toBe( ' ' );
	} );

	it( 'should paste special whitespace in plain text only', () => {
		const filtered = pasteHandler( {
			HTML: '',
			plainText: ' ',
			mode: 'AUTO',
		} );

		expect( console ).toHaveLogged();
		expect( filtered ).toBe( ' ' );
	} );

	it( 'should parse Markdown', () => {
		const filtered = pasteHandler( {
			HTML: '* one<br>* two<br>* three',
			plainText: '* one\n* two\n* three',
			mode: 'AUTO',
		} )
			.map( getBlockContent )
			.join( '' );

		expect( filtered ).toBe(
			'<ul><li>one</li><li>two</li><li>three</li></ul>'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'should parse inline Markdown', () => {
		const filtered = pasteHandler( {
			HTML: 'Some **bold** text.',
			plainText: 'Some **bold** text.',
			mode: 'AUTO',
		} );

		expect( filtered ).toBe( 'Some <strong>bold</strong> text.' );
		expect( console ).toHaveLogged();
	} );

	it( 'should parse HTML in plainText', () => {
		const filtered = pasteHandler( {
			HTML:
				'&lt;p&gt;Some &lt;strong&gt;bold&lt;/strong&gt; text.&lt;/p&gt;',
			plainText: '<p>Some <strong>bold</strong> text.</p>',
			mode: 'AUTO',
		} );

		expect( filtered ).toBe( 'Some <strong>bold</strong> text.' );
		expect( console ).toHaveLogged();
	} );

	it( 'should parse Markdown with HTML', () => {
		const filtered = pasteHandler( {
			HTML: '',
			plainText: '# Some <em>heading</em>\n\nA paragraph.',
			mode: 'AUTO',
		} )
			.map( getBlockContent )
			.join( '' );

		expect( filtered ).toBe(
			'<h1>Some <em>heading</em></h1><p>A paragraph.</p>'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'should break up forced inline content', () => {
		const filtered = pasteHandler( {
			HTML: '<p>test</p><p>test</p>',
			mode: 'INLINE',
		} );

		expect( filtered ).toBe( 'test<br>test' );
		expect( console ).toHaveLogged();
	} );

	it( 'should normalize decomposed characters', () => {
		const filtered = pasteHandler( {
			HTML: 'schön',
			mode: 'INLINE',
		} );

		expect( filtered ).toBe( 'schön' );
		expect( console ).toHaveLogged();
	} );

	it( 'should not treat single non-inlineable block as inline text', () => {
		const filtered = pasteHandler( {
			HTML: '<p>words to live by</p>',
			plainText: 'words to live by\n',
			mode: 'AUTO',
		} );

		expect( filtered ).toHaveLength( 1 );
		expect( filtered[ 0 ].name ).toBe( 'core/embed' );
		expect( console ).toHaveLogged();
	} );

	it( 'should treat single heading as inline text', () => {
		const filtered = pasteHandler( {
			HTML: '<h1>FOO</h1>',
			plainText: 'FOO\n',
			mode: 'AUTO',
		} );

		expect( filtered ).toBe( 'FOO' );
		expect( console ).toHaveLogged();
	} );

	it( 'should treat single list item as inline text', () => {
		const filtered = pasteHandler( {
			HTML: '<ul><li>Some <strong>bold</strong> text.</li></ul>',
			plainText: 'Some <strong>bold</strong> text.\n',
			mode: 'AUTO',
		} );

		expect( filtered ).toBe( 'Some <strong>bold</strong> text.' );
		expect( console ).toHaveLogged();
	} );

	it( 'should treat multiple list items as a block', () => {
		const filtered = pasteHandler( {
			HTML: '<ul><li>One</li><li>Two</li><li>Three</li></ul>',
			plainText: 'One\nTwo\nThree\n',
			mode: 'AUTO',
		} )
			.map( getBlockContent )
			.join( '' );

		expect( filtered ).toBe(
			'<ul><li>One</li><li>Two</li><li>Three</li></ul>'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'should correctly handle quotes with one paragraphs and no citation', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><p>chicken</p></blockquote>',
			mode: 'AUTO',
		} )
			.map( getBlockContent )
			.join( '' );

		expect( filtered ).toBe(
			'<blockquote class="wp-block-quote"><p>chicken</p></blockquote>'
		);
		expect( console ).toHaveLogged();
	} );
	it( 'should correctly handle quotes with multiple paragraphs and no citation', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><p>chicken</p><p>ribs</p></blockquote>',
			mode: 'AUTO',
		} )
			.map( getBlockContent )
			.join( '' );

		expect( filtered ).toBe(
			'<blockquote class="wp-block-quote"><p>chicken</p><p>ribs</p></blockquote>'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'should correctly handle quotes with paragraph and citation at the end', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><p>chicken</p><cite>ribs</cite></blockquote>',
			mode: 'AUTO',
		} )
			.map( getBlockContent )
			.join( '' );

		expect( filtered ).toBe(
			'<blockquote class="wp-block-quote"><p>chicken</p><cite>ribs</cite></blockquote>'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'should handle a citation before the content', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><cite>ribs</cite><p>ribs</p></blockquote>',
			mode: 'AUTO',
		} )
			.map( getBlockContent )
			.join( '' );

		expect( filtered ).toBe(
			'<blockquote class="wp-block-quote"><p>ribs</p><cite>ribs</cite></blockquote>'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'should handle a citation in the middle of the content', () => {
		const filtered = pasteHandler( {
			HTML:
				'<blockquote><p>chicken</p><cite>ribs</cite><p>ribs</p></blockquote>',
			mode: 'AUTO',
		} )
			.map( getBlockContent )
			.join( '' );

		expect( filtered ).toBe(
			'<blockquote class="wp-block-quote"><p>chicken</p><p>ribs</p><cite>ribs</cite></blockquote>'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'should correctly handle quotes with only a citation', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><cite>ribs</cite></blockquote>',
			mode: 'AUTO',
		} )
			.map( getBlockContent )
			.join( '' );

		expect( filtered ).toBe(
			'<blockquote class="wp-block-quote"><p></p><cite>ribs</cite></blockquote>'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'should convert to paragraph quotes with more than one cite', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><cite>ribs</cite><cite>ribs</cite></blockquote>',
			mode: 'AUTO',
		} )
			.map( getBlockContent )
			.join( '' );

		expect( filtered ).toBe( '<p>ribsribs</p>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should convert to paragraph quotes with more than one cite and at least one paragraph', () => {
		const filtered = pasteHandler( {
			HTML:
				'<blockquote><p>chicken</p><cite>ribs</cite><cite>ribs</cite></blockquote>',
			mode: 'AUTO',
		} )
			.map( getBlockContent )
			.join( '' );

		expect( filtered ).toBe( '<p>chickenribsribs</p>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should paste gutenberg content from plain text', () => {
		const block = '<!-- wp:latest-posts /-->';
		expect(
			serialize(
				pasteHandler( {
					plainText: block,
					mode: 'AUTO',
				} )
			)
		).toBe( block );
	} );

	it( 'should handle transforms that return an array of blocks', () => {
		const transformed = pasteHandler( {
			HTML: '<p>P1 P2</p>',
			plainText: 'P1 P2\n',
		} )
			.map( getBlockContent )
			.join( '' );

		expect( transformed ).toBe( '<p>1</p><p>2</p>' );
		expect( console ).toHaveLogged();
	} );

	describe( 'pasteHandler', () => {
		[
			'plain',
			'classic',
			'nested-divs',
			'apple',
			'google-docs',
			'google-docs-table',
			'google-docs-table-with-comments',
			'google-docs-with-comments',
			'ms-word',
			'ms-word-styled',
			'ms-word-online',
			'evernote',
			'iframe-embed',
			'one-image',
			'two-images',
			'markdown',
			'wordpress',
			'gutenberg',
			'shortcode-matching',
		].forEach( ( type ) => {
			// eslint-disable-next-line jest/valid-title
			it( type, () => {
				const HTML = readFile(
					path.join(
						__dirname,
						`fixtures/documents/${ type }-in.html`
					)
				);
				const plainText = readFile(
					path.join(
						__dirname,
						`fixtures/documents/${ type }-in.txt`
					)
				);
				const output = readFile(
					path.join(
						__dirname,
						`fixtures/documents/${ type }-out.html`
					)
				);

				if ( ! ( HTML || plainText ) || ! output ) {
					throw new Error( `Expected fixtures for type ${ type }` );
				}

				const converted = pasteHandler( { HTML, plainText } );
				const serialized =
					typeof converted === 'string'
						? converted
						: serialize( converted );

				expect( serialized ).toBe( output );

				if ( type !== 'gutenberg' ) {
					// eslint-disable-next-line jest/no-conditional-expect
					expect( console ).toHaveLogged();
				}
			} );
		} );

		it( 'should strip some text-level elements', () => {
			const HTML = '<p>This is <u>ncorect</u></p>';
			expect( serialize( pasteHandler( { HTML } ) ) ).toMatchSnapshot();
			expect( console ).toHaveLogged();
		} );

		it( 'should remove extra blank lines', () => {
			const HTML = readFile(
				path.join(
					__dirname,
					'fixtures/documents/google-docs-blank-lines.html'
				)
			);
			expect( serialize( pasteHandler( { HTML } ) ) ).toMatchSnapshot();
			expect( console ).toHaveLogged();
		} );

		it( 'should strip windows data', () => {
			const HTML = readFile(
				path.join( __dirname, 'fixtures/documents/windows.html' )
			);
			expect( serialize( pasteHandler( { HTML } ) ) ).toMatchSnapshot();
		} );

		it( 'should strip HTML formatting space from inline text', () => {
			const HTML = readFile(
				path.join(
					__dirname,
					'fixtures/documents/inline-with-html-formatting-space.html'
				)
			);
			expect( pasteHandler( { HTML } ) ).toMatchSnapshot();
			expect( console ).toHaveLogged();
		} );
	} );
} );

describe( 'rawHandler', () => {
	it( 'should convert HTML post to blocks with minimal content changes', () => {
		const HTML = readFile(
			path.join( __dirname, 'fixtures/documents/wordpress-convert.html' )
		);
		expect( serialize( rawHandler( { HTML } ) ) ).toMatchSnapshot();
	} );

	it( 'should convert a caption shortcode', () => {
		const HTML = readFile(
			path.join( __dirname, 'fixtures/documents/shortcode-caption.html' )
		);
		expect( serialize( rawHandler( { HTML } ) ) ).toMatchSnapshot();
	} );

	it( 'should convert a caption shortcode with link', () => {
		const HTML = readFile(
			path.join(
				__dirname,
				'fixtures/documents/shortcode-caption-with-link.html'
			)
		);
		expect( serialize( rawHandler( { HTML } ) ) ).toMatchSnapshot();
	} );

	it( 'should convert a caption shortcode with caption', () => {
		const HTML = readFile(
			path.join(
				__dirname,
				'fixtures/documents/shortcode-caption-with-caption-link.html'
			)
		);
		expect( serialize( rawHandler( { HTML } ) ) ).toMatchSnapshot();
	} );

	it( 'should convert a list with attributes', () => {
		const HTML = readFile(
			path.join(
				__dirname,
				'fixtures/documents/list-with-attributes.html'
			)
		);
		expect( serialize( rawHandler( { HTML } ) ) ).toMatchSnapshot();
	} );

	it( 'should not strip any text-level elements', () => {
		const HTML = '<p>This is <u>ncorect</u></p>';
		expect( serialize( rawHandler( { HTML } ) ) ).toMatchSnapshot();
	} );

	it( 'should preserve alignment', () => {
		const HTML = '<p style="text-align:center">center</p>';
		expect( serialize( rawHandler( { HTML } ) ) ).toMatchSnapshot();
	} );
} );
