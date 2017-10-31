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
import { children, prop } from '../../source';

describe( 'rawHandler', () => {
	beforeAll( () => {
		registerBlockType( 'test/figure', {
			category: 'common',
			title: 'test figure',
			attributes: {
				content: {
					type: 'array',
					source: children( 'figure' ),
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

		registerBlockType( 'test/unknown', {
			category: 'common',
			title: 'test unknown',
			attributes: {
				content: {
					type: 'string',
					source: prop( 'innerHTML' ),
				},
			},
			save: () => {},
		} );

		setUnknownTypeHandlerName( 'test/unknown' );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/figure' );
		unregisterBlockType( 'test/unknown' );
		setUnknownTypeHandlerName( undefined );
	} );

	it( 'should convert recognised raw content', () => {
		const block = rawHandler( { HTML: '<figure>test</figure>' } )[ 0 ];
		const { name, attributes } = createBlock( 'test/figure', { content: [ 'test' ] } );

		equal( block.name, name );
		deepEqual( block.attributes, attributes );
	} );

	it( 'should handle unknown raw content', () => {
		const block = rawHandler( { HTML: '<figcaption>test</figcaption>' } )[ 0 ];

		equal( block.name, 'test/unknown' );
		equal( block.attributes.content, '<figcaption>test</figcaption>' );
	} );

	it( 'should filter inline content', () => {
		const filtered = rawHandler( {
			HTML: '<h2><em>test</em></h2>',
			inline: true,
		} );

		equal( filtered, '<em>test</em>' );
	} );

	it( 'should always return blocks', () => {
		const blocks = rawHandler( {
			HTML: 'test',
			inline: false,
		} );

		equal( Array.isArray( blocks ), true );
	} );
} );

import './integration';
