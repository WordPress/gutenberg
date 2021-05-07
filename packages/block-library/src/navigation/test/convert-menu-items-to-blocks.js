/**
 * Internal dependencies
 */
import convertMenuItemsToBlocks from '../convert-menu-items-to-blocks';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { metadata, settings, name } from '../../navigation-link/index';

function stripClientIdsFromBlocks( blocks ) {
	return blocks.map( ( block ) => {
		block.clientId = null;
		delete block.clientId;
		return block;
	} );
}

describe( 'converting menu items to blocks', () => {
	beforeAll( () => {
		registerBlockType( name, {
			...metadata,
			...settings,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( name );
	} );

	it( 'converts an flat structure of menu item objects to blocks', () => {
		let actual = convertMenuItemsToBlocks( [
			{
				id: 1,
				title: {
					raw: 'Item 1',
					rendered: 'Item 1',
				},
				url: 'http://localhost:8889/item-1/',
				attr_title: '',
				description: '',
				type: 'custom',
				type_label: 'Custom Link',
				object: 'custom',
				parent: 0,
				menu_order: 1,
				target: '',
				classes: [ '' ],
				xfn: [ '' ],
			},
			{
				id: 2,
				title: {
					raw: 'Item 2',
					rendered: 'Item 2',
				},
				url: 'http://localhost:8889/',
				attr_title: '',
				description: '',
				type: 'custom',
				type_label: 'Custom Link',
				object: 'custom',
				parent: 0,
				menu_order: 2,
				target: '',
				classes: [ '' ],
				xfn: [ '' ],
			},
		] );

		actual = stripClientIdsFromBlocks( actual );

		expect( actual ).toEqual( [
			expect.objectContaining( {
				name: 'core/navigation-link',
				innerBlocks: [],
			} ),
			expect.objectContaining( {
				name: 'core/navigation-link',
				innerBlocks: [],
			} ),
		] );
	} );

	it( 'converts an nested structure of menu item objects to nested blocks', () => {
		let actual = convertMenuItemsToBlocks( [
			{
				id: 1,
				title: {
					raw: 'Top Level',
					rendered: 'Top Level',
				},
				url: 'http://localhost:8889/',
				attr_title: '',
				description: '',
				type: 'custom',
				type_label: 'Custom Link',
				object: 'custom',
				parent: 0,
				menu_order: 1,
				target: '',
				classes: [ '' ],
				xfn: [ '' ],
			},
			{
				id: 2,
				title: {
					raw: 'Child 1',
					rendered: 'Child 1',
				},
				url: 'http://localhost:8889/',
				attr_title: '',
				description: '',
				type: 'custom',
				type_label: 'Custom Link',
				object: 'custom',
				parent: 1,
				menu_order: 1,
				target: '',
				classes: [ '' ],
				xfn: [ '' ],
			},
			{
				id: 3,
				title: {
					raw: 'Child 2',
					rendered: 'Child 2',
				},
				url: 'http://localhost:8889/',
				attr_title: '',
				description: '',
				type: 'custom',
				type_label: 'Custom Link',
				object: 'custom',
				parent: 1,
				menu_order: 2,
				target: '',
				classes: [ '' ],
				xfn: [ '' ],
			},
			{
				id: 4,
				title: {
					raw: 'Sub Child',
					rendered: 'Sub Child',
				},
				url: 'http://localhost:8889/',
				attr_title: '',
				description: '',
				type: 'custom',
				type_label: 'Custom Link',
				object: 'custom',
				parent: 3,
				menu_order: 1,
				target: '',
				classes: [ '' ],
				xfn: [ '' ],
			},
			{
				id: 5,
				title: {
					raw: 'Sub Sub Child',
					rendered: 'Sub Sub Child',
				},
				url: 'http://localhost:8889/',
				attr_title: '',
				description: '',
				type: 'custom',
				type_label: 'Custom Link',
				object: 'custom',
				parent: 4,
				menu_order: 1,
				target: '',
				classes: [ '' ],
				xfn: [ '' ],
			},
			{
				id: 6,
				title: {
					raw: 'Top Level 2',
					rendered: 'Top Level 2',
				},
				url: 'http://localhost:8889/',
				attr_title: '',
				description: '',
				type: 'custom',
				type_label: 'Custom Link',
				object: 'custom',
				parent: 0,
				menu_order: 2,
				target: '',
				classes: [ '' ],
				xfn: [ '' ],
			},
		] );

		actual = stripClientIdsFromBlocks( actual );

		expect( actual ).toEqual( [
			expect.objectContaining( {
				name: 'core/navigation-link',
				attributes: expect.objectContaining( {
					label: 'Top Level',
				} ),
				innerBlocks: [
					expect.objectContaining( {
						name: 'core/navigation-link',
						attributes: expect.objectContaining( {
							label: 'Child 1',
						} ),
						innerBlocks: [],
					} ),
					expect.objectContaining( {
						name: 'core/navigation-link',
						attributes: expect.objectContaining( {
							label: 'Child 2',
						} ),
						innerBlocks: [
							expect.objectContaining( {
								name: 'core/navigation-link',
								attributes: expect.objectContaining( {
									label: 'Sub Child',
								} ),
								innerBlocks: [
									expect.objectContaining( {
										name: 'core/navigation-link',
										attributes: expect.objectContaining( {
											label: 'Sub Sub Child',
										} ),
										innerBlocks: [],
									} ),
								],
							} ),
						],
					} ),
				],
			} ),
			expect.objectContaining( {
				name: 'core/navigation-link',
				attributes: expect.objectContaining( {
					label: 'Top Level 2',
				} ),
				innerBlocks: [],
			} ),
		] );
	} );

	it( 'respects menu order when converting to blocks', () => {
		let actual = convertMenuItemsToBlocks( [
			{
				id: 1,
				title: {
					raw: 'Ordered 4th',
					rendered: 'Ordered 4th',
				},
				url: 'http://localhost:8889/item-1/',
				attr_title: '',
				description: '',
				type: 'custom',
				type_label: 'Custom Link',
				object: 'custom',
				parent: 0,
				menu_order: 100,
				target: '',
				classes: [ '' ],
				xfn: [ '' ],
			},
			{
				id: 2,
				title: {
					raw: 'Ordered 1st',
					rendered: 'Ordered 1st',
				},
				url: 'http://localhost:8889/',
				attr_title: '',
				description: '',
				type: 'custom',
				type_label: 'Custom Link',
				object: 'custom',
				parent: 0,
				menu_order: 10,
				target: '',
				classes: [ '' ],
				xfn: [ '' ],
			},
			{
				id: 3,
				title: {
					raw: 'Ordered 3rd',
					rendered: 'Ordered 3rd',
				},
				url: 'http://localhost:8889/',
				attr_title: '',
				description: '',
				type: 'custom',
				type_label: 'Custom Link',
				object: 'custom',
				parent: 0,
				menu_order: 30,
				target: '',
				classes: [ '' ],
				xfn: [ '' ],
			},
			{
				id: 4,
				title: {
					raw: 'Ordered 2nd',
					rendered: 'Ordered 2nd',
				},
				url: 'http://localhost:8889/',
				attr_title: '',
				description: '',
				type: 'custom',
				type_label: 'Custom Link',
				object: 'custom',
				parent: 0,
				menu_order: 20,
				target: '',
				classes: [ '' ],
				xfn: [ '' ],
			},
		] );

		actual = stripClientIdsFromBlocks( actual );

		expect( actual ).toEqual( [
			expect.objectContaining( {
				name: 'core/navigation-link',
				attributes: expect.objectContaining( {
					label: 'Ordered 1st',
				} ),
			} ),
			expect.objectContaining( {
				name: 'core/navigation-link',
				attributes: expect.objectContaining( {
					label: 'Ordered 2nd',
				} ),
			} ),
			expect.objectContaining( {
				name: 'core/navigation-link',
				attributes: expect.objectContaining( {
					label: 'Ordered 3rd',
				} ),
			} ),
			expect.objectContaining( {
				name: 'core/navigation-link',
				attributes: expect.objectContaining( {
					label: 'Ordered 4th',
				} ),
			} ),
		] );
	} );

	it( 'returns an empty array when menu items argument is an empty array', () => {
		const actual = convertMenuItemsToBlocks( [] );
		expect( actual ).toEqual( [] );
	} );
} );
