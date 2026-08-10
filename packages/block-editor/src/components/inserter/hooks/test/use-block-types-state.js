/**
 * WordPress dependencies
 */
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getInsertableUnsyncedBlocks } from '../use-block-types-state';

describe( 'getInsertableUnsyncedBlocks', () => {
	beforeAll( () => {
		registerBlockType( 'core/buttons', {
			apiVersion: 3,
			save: () => null,
			category: 'design',
			title: 'Buttons',
		} );
		registerBlockType( 'core/button', {
			apiVersion: 3,
			save: () => null,
			category: 'design',
			title: 'Button',
			parent: [ 'core/buttons' ],
			attributes: {
				text: {
					type: 'string',
				},
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/button' );
		unregisterBlockType( 'core/buttons' );
	} );

	it( 'keeps blocks that can already be inserted at the root', () => {
		const block = createBlock( 'core/buttons' );

		expect(
			getInsertableUnsyncedBlocks( [ block ], '', () => true )
		).toEqual( [ block ] );
	} );

	it( 'wraps a child-only block when its parent can be inserted', () => {
		const block = createBlock( 'core/button', { text: 'Fake Text!' } );
		const canInsertBlockType = ( name ) => name === 'core/buttons';

		const result = getInsertableUnsyncedBlocks(
			[ block ],
			'',
			canInsertBlockType
		);

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name ).toBe( 'core/buttons' );
		expect( result[ 0 ].innerBlocks ).toHaveLength( 1 );
		expect( result[ 0 ].innerBlocks[ 0 ] ).toBe( block );
	} );

	it( 'wraps a child-only block when selector is unavailable', () => {
		const block = createBlock( 'core/button', { text: 'Fake Text!' } );

		const result = getInsertableUnsyncedBlocks( [ block ] );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name ).toBe( 'core/buttons' );
		expect( result[ 0 ].innerBlocks ).toHaveLength( 1 );
		expect( result[ 0 ].innerBlocks[ 0 ] ).toBe( block );
	} );
} );
