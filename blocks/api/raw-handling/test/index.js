/**
 * External dependencies
 */
import { equal, deepEqual } from 'assert';

/**
 * Internal dependencies
 */
import rawHandler from '../index';
import { registerBlockType, unregisterBlockType, setUnknownTypeHandlerName } from '../../registration';
import { createBlock } from '../../factory';
import { getBlockContent } from '../../serializer';

describe( 'rawHandler', () => {
	it( 'should convert recognised raw content', () => {
		registerBlockType( 'test/figure', {
			category: 'common',
			title: 'test figure',
			attributes: {
				content: {
					type: 'array',
					source: 'children',
					selector: 'figure',
				},
			},
			transforms: {
				from: [
					{
						type: 'raw',
						isMatch: ( node ) => node.nodeName === 'FIGURE',
					},
				],
			},
			save: () => {},
		} );

		const block = rawHandler( { HTML: '<figure>test</figure>' } )[ 0 ];
		const { name, attributes } = createBlock( 'test/figure', { content: [ 'test' ] } );

		equal( block.name, name );
		deepEqual( block.attributes, attributes );

		unregisterBlockType( 'test/figure' );
	} );

	it( 'should handle unknown raw content', () => {
		registerBlockType( 'test/unknown', {
			category: 'common',
			title: 'test unknown',
			attributes: {
				content: {
					type: 'string',
					source: 'property',
					property: 'innerHTML',
				},
			},
			save: () => {},
		} );
		setUnknownTypeHandlerName( 'test/unknown' );

		const block = rawHandler( { HTML: '<figcaption>test</figcaption>' } )[ 0 ];

		equal( block.name, 'test/unknown' );
		equal( block.attributes.content, '<figcaption>test</figcaption>' );

		unregisterBlockType( 'test/unknown' );
		setUnknownTypeHandlerName( undefined );
	} );

	it( 'should handle raw content with transform', () => {
		registerBlockType( 'test/transform', {
			category: 'common',
			title: 'test figure',
			attributes: {
				content: {
					type: 'array',
				},
			},
			transforms: {
				from: [
					{
						type: 'raw',
						isMatch: ( node ) => node.nodeName === 'FIGURE',
						transform: ( node ) => createBlock( 'test/transform', { content: node.nodeName } ),
					},
				],
			},
			save: () => {},
		} );

		const block = rawHandler( { HTML: '<figure>test</figure>' } )[ 0 ];

		equal( block.name, 'test/transform' );
		equal( block.attributes.content, 'FIGURE' );

		unregisterBlockType( 'test/transform' );
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

		equal( filtered, '<ul>\n    <li>one</li>\n    <li>two</li>\n    <li>three</li>\n</ul>' );
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
} );

import './integration';
