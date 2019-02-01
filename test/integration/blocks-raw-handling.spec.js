/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';

/**
 * WordPress dependencies
 */
import {
	getBlockContent,
	pasteHandler,
	rawHandler,
	serialize,
} from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

function readFile( filePath ) {
	return fs.existsSync( filePath ) ? fs.readFileSync( filePath, 'utf8' ).trim() : '';
}

describe( 'Blocks raw handling', () => {
	beforeAll( () => {
		// Load all hooks that modify blocks
		require( '../../packages/editor/src/hooks' );
		registerCoreBlocks();
	} );

	it( 'should filter inline content', () => {
		const filtered = pasteHandler( {
			HTML: '<h2><em>test</em></h2>',
			mode: 'INLINE',
		} );

		expect( filtered ).toBe( '<em>test</em>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should parse Markdown', () => {
		const filtered = pasteHandler( {
			HTML: '* one<br>* two<br>* three',
			plainText: '* one\n* two\n* three',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<ul><li>one</li><li>two</li><li>three</li></ul>' );
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
			HTML: '&lt;p&gt;Some &lt;strong&gt;bold&lt;/strong&gt; text.&lt;/p&gt;',
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
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<h1>Some <em>heading</em></h1><p>A paragraph.</p>' );
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
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<ul><li>One</li><li>Two</li><li>Three</li></ul>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should correctly handle quotes with one paragraphs and no citation', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><p>chicken</p></blockquote>',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<blockquote class="wp-block-quote"><p>chicken</p></blockquote>' );
		expect( console ).toHaveLogged();
	} );
	it( 'should correctly handle quotes with multiple paragraphs and no citation', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><p>chicken</p><p>ribs</p></blockquote>',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<blockquote class="wp-block-quote"><p>chicken</p><p>ribs</p></blockquote>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should correctly handle quotes with paragraph and citation at the end', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><p>chicken</p><cite>ribs</cite></blockquote>',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<blockquote class="wp-block-quote"><p>chicken</p><cite>ribs</cite></blockquote>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should handle a citation before the content', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><cite>ribs</cite><p>ribs</p></blockquote>',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<blockquote class="wp-block-quote"><p>ribs</p><cite>ribs</cite></blockquote>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should handle a citation in the middle of the content', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><p>chicken</p><cite>ribs</cite><p>ribs</p></blockquote>',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<blockquote class="wp-block-quote"><p>chicken</p><p>ribs</p><cite>ribs</cite></blockquote>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should correctly handle quotes with only a citation', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><cite>ribs</cite></blockquote>',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<blockquote class="wp-block-quote"><p></p><cite>ribs</cite></blockquote>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should convert to paragraph quotes with more than one cite', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><cite>ribs</cite><cite>ribs</cite></blockquote>',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<p>ribsribs</p>' );
		expect( console ).toHaveLogged();
	} );

	it( 'should convert to paragraph quotes with more than one cite and at least one paragraph', () => {
		const filtered = pasteHandler( {
			HTML: '<blockquote><p>chicken</p><cite>ribs</cite><cite>ribs</cite></blockquote>',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<p>chickenribsribs</p>' );
		expect( console ).toHaveLogged();
	} );

	describe( 'pasteHandler', () => {
		[
			'plain',
			'classic',
			'apple',
			'google-docs',
			'google-docs-table',
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
			'caption-shortcode',
		].forEach( ( type ) => {
			it( type, () => {
				const HTML = readFile( path.join( __dirname, `fixtures/${ type }-in.html` ) );
				const plainText = readFile( path.join( __dirname, `fixtures/${ type }-in.txt` ) );
				const output = readFile( path.join( __dirname, `fixtures/${ type }-out.html` ) );
				const converted = pasteHandler( { HTML, plainText, canUserUseUnfilteredHTML: true } );
				const serialized = typeof converted === 'string' ? converted : serialize( converted );

				expect( serialized ).toBe( output );

				if ( type !== 'gutenberg' ) {
					expect( console ).toHaveLogged();
				}
			} );
		} );
	} );
} );

describe( 'rawHandler', () => {
	it( 'should convert HTML post to blocks with minimal content changes', () => {
		const HTML = readFile( path.join( __dirname, 'fixtures/wordpress-convert.html' ) );
		expect( serialize( rawHandler( { HTML } ) ) ).toMatchSnapshot();
	} );

	it( 'should convert a caption shortcode', () => {
		const HTML = readFile( path.join( __dirname, 'fixtures/shortcode-caption.html' ) );
		expect( serialize( rawHandler( { HTML } ) ) ).toMatchSnapshot();
	} );

	it( 'should convert a caption shortcode with link', () => {
		const HTML = readFile( path.join( __dirname, 'fixtures/shortcode-caption-with-link.html' ) );
		expect( serialize( rawHandler( { HTML } ) ) ).toMatchSnapshot();
	} );

	it( 'should convert a caption shortcode with caption', () => {
		const HTML = readFile( path.join( __dirname, 'fixtures/shortcode-caption-with-caption-link.html' ) );
		expect( serialize( rawHandler( { HTML } ) ) ).toMatchSnapshot();
	} );
} );
