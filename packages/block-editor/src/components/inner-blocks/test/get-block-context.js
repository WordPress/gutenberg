/**
 * WordPress dependencies
 */
import {
	getBlockType,
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import getBlockContext from '../get-block-context';

describe( 'getBlockContext', () => {
	beforeAll( () => {
		registerBlockType( 'core/fruit-basket', {
			category: 'text',
			title: 'Fruit Basket',
			attributes: {
				id: {
					type: 'number',
				},
				name: {
					type: 'string',
				},
			},
			providesContext: { basketId: 'id' },
		} );
	} );
	afterAll( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should return cached value when attributes are the same', () => {
		const attributes = { id: 1, name: '' };
		const blockType = getBlockType( 'core/fruit-basket' );

		const prevContext = getBlockContext( attributes, blockType );
		const nextContext = getBlockContext( attributes, blockType );

		expect( prevContext ).toBe( nextContext );
	} );

	it( 'should return cached value if attributes used in context are the same', () => {
		const blockType = getBlockType( 'core/fruit-basket' );

		const prevContext = getBlockContext( { id: 1, name: '' }, blockType );
		const nextContext = getBlockContext(
			{ id: 1, name: 'Apples' },
			blockType
		);

		expect( prevContext ).toBe( nextContext );
	} );
} );
