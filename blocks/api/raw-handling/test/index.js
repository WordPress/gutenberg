/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import rawHandler from '../index';
import { getBlockContent } from '../../serializer';
import { registerCoreBlocks } from '../../../../core-blocks';

describe( 'rawHandler', () => {
	beforeAll( () => {
		// Load all hooks that modify blocks
		require( 'blocks/hooks' );
		registerCoreBlocks();
	} );

	it( 'should filter inline content', () => {
		const filtered = rawHandler( {
			HTML: '<h2><em>test</em></h2>',
			mode: 'INLINE',
		} );

		equal( filtered, '<em>test</em>' );
	} );

	it( 'should parse Markdown', () => {
		const filtered = rawHandler( {
			HTML: '* one<br>* two<br>* three',
			plainText: '* one\n* two\n* three',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		equal( filtered, '<ul>\n\t<li>one</li>\n\t<li>two</li>\n\t<li>three</li>\n</ul>' );
	} );

	it( 'should parse inline Markdown', () => {
		const filtered = rawHandler( {
			HTML: 'Some **bold** text.',
			plainText: 'Some **bold** text.',
			mode: 'AUTO',
		} );

		equal( filtered, 'Some <strong>bold</strong> text.' );
	} );

	it( 'should parse HTML in plainText', () => {
		const filtered = rawHandler( {
			HTML: '&lt;p&gt;Some &lt;strong&gt;bold&lt;/strong&gt; text.&lt;/p&gt;',
			plainText: '<p>Some <strong>bold</strong> text.</p>',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		equal( filtered, '<p>Some <strong>bold</strong> text.</p>' );
	} );

	it( 'should parse Markdown with HTML', () => {
		const filtered = rawHandler( {
			HTML: '',
			plainText: '# Some <em>heading</em>',
			mode: 'AUTO',
		} ).map( getBlockContent ).join( '' );

		equal( filtered, '<h1>Some <em>heading</em></h1>' );
	} );

	it( 'should break up forced inline content', () => {
		const filtered = rawHandler( {
			HTML: '<p>test</p><p>test</p>',
			mode: 'INLINE',
		} );

		equal( filtered, 'test<br>test' );
	} );
} );

import './integration';
