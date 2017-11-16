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

	it( 'should always return blocks', () => {
		const blocks = rawHandler( {
			HTML: 'test',
			mode: 'BLOCKS',
		} );

		equal( Array.isArray( blocks ), true );
	} );
} );

import './integration';
