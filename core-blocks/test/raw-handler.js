/**
 * WordPress dependencies
 */
import { getBlockContent, rawHandler } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { registerCoreBlocks } from '../';

describe( 'rawHandler', () => {
	beforeAll( () => {
		// Load all hooks that modify blocks
		require( 'editor/hooks' );
		registerCoreBlocks();
	} );

	it( 'should filter inline content', () => {
		const filtered = rawHandler( {
			HTML: '<h2><em>test</em></h2>',
			mode: 'INLINE',
		} );

		expect( filtered ).toBe( '<em>test</em>' );
	} );

	it( 'should parse Markdown', () => {
		const filtered = rawHandler( {
			HTML: '* one<br>* two<br>* three',
			plainText: '* one\n* two\n* three',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<ul>\n\t<li>one</li>\n\t<li>two</li>\n\t<li>three</li>\n</ul>' );
	} );

	it( 'should parse inline Markdown', () => {
		const filtered = rawHandler( {
			HTML: 'Some **bold** text.',
			plainText: 'Some **bold** text.',
			mode: 'AUTO',
		} );

		expect( filtered ).toBe( 'Some <strong>bold</strong> text.' );
	} );

	it( 'should parse HTML in plainText', () => {
		const filtered = rawHandler( {
			HTML: '&lt;p&gt;Some &lt;strong&gt;bold&lt;/strong&gt; text.&lt;/p&gt;',
			plainText: '<p>Some <strong>bold</strong> text.</p>',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<p>Some <strong>bold</strong> text.</p>' );
	} );

	it( 'should parse Markdown with HTML', () => {
		const filtered = rawHandler( {
			HTML: '',
			plainText: '# Some <em>heading</em>',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		expect( filtered ).toBe( '<h1>Some <em>heading</em></h1>' );
	} );

	it( 'should break up forced inline content', () => {
		const filtered = rawHandler( {
			HTML: '<p>test</p><p>test</p>',
			mode: 'INLINE',
		} );

		expect( filtered ).toBe( 'test<br>test' );
	} );
} );
