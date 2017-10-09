/**
 * External dependencies
 */
import { equal, deepEqual } from 'assert';

/**
 * Internal dependencies
 */
import paste from '../index';
import { registerBlockType, unregisterBlockType, setUnknownTypeHandlerName } from '../../registration';
import { createBlock } from '../../factory';
import { children, prop } from '../../source';

describe( 'paste', () => {
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

	it( 'should convert recognised pasted content', () => {
		const pastedBlock = paste( { HTML: '<figure>test</figure>' } )[ 0 ];
		const block = createBlock( 'test/figure', { content: [ 'test' ] } );

		equal( pastedBlock.name, block.name );
		deepEqual( pastedBlock.attributes, block.attributes );
	} );

	it( 'should handle unknown pasted content', () => {
		const pastedBlock = paste( { HTML: '<figcaption>test</figcaption>' } )[ 0 ];

		equal( pastedBlock.name, 'test/unknown' );
		equal( pastedBlock.attributes.content, '<figcaption>test</figcaption>' );
	} );

	it( 'should filter inline content', () => {
		const filtered = paste( {
			HTML: '<h2><em>test</em></h2>',
			inline: true,
		} );

		equal( filtered, '<em>test</em>' );
	} );
} );

import './integration';
