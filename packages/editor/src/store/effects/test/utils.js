/**
 * WordPress dependencies
 */
import { registerStore, select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { resolveSelector } from '../utils';

describe( 'resolveSelector', () => {
	const storeConfig = {
		reducer: ( state = 'no', action ) => {
			if ( action.type === 'resolve' ) {
				return 'yes';
			}
			return state;
		},
		selectors: {
			selectAll: ( state, key ) => ( key === 'check' ) ? state : 'no-key',
		},
		resolvers: {
			selectAll: () => {
				return new Promise( ( resolve ) => {
					resolve( { type: 'resolve' } );
				} );
			},
		},
	};

	it( 'Should wait for selector resolution', async () => {
		registerStore( 'resolveStore', storeConfig );

		expect( select( 'resolveStore' ).selectAll( 'check' ) ).toBe( 'no' );
		const value = await resolveSelector( 'resolveStore', 'selectAll', 'check' );
		expect( value ).toBe( 'yes' );
	} );

	it( 'Should resolve already resolved selectors', async () => {
		registerStore( 'resolveStore2', storeConfig );

		// Trigger resolution
		const value = await resolveSelector( 'resolveStore2', 'selectAll', 'check' );
		expect( value ).toBe( 'yes' );
		await resolveSelector( 'resolveStore2', 'selectAll', 'check' );
		expect( value ).toBe( 'yes' );
	} );
} );
