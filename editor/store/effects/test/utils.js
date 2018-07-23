/**
 * WordPress dependencies
 */
import { registerStore, select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { resolveSelector } from '../utils';

describe( 'resolveSelector', () => {
	it( 'Should wait for selector resolution', () => {
		registerStore( 'resolveStore', {
			reducer: ( state = 'no', action ) => {
				if ( action.type === 'resolve' ) {
					return 'yes';
				}
				if ( action.type === 'reset' ) {
					return 'no';
				}
				return state;
			},
			selectors: {
				selectAll: ( state, key ) => ( key === 'check' ) ? state : 'no-key',
			},
			resolvers: {
				selectAll: () => {
					return new Promise( ( resolve ) => {
						process.nextTick( () => resolve( { type: 'resolve' } ) );
					} );
				},
			},
		} );

		expect( select( 'resolveStore' ).selectAll( 'check' ) ).toBe( 'no' );
		return resolveSelector( 'resolveStore', 'selectAll', 'check' ).then( ( value ) => {
			expect( value ).toBe( 'yes' );
		} );
	} );

	it( 'Should resolve already resolved selectors', ( done ) => {
		registerStore( 'resolveStore2', {
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
						process.nextTick( () => resolve( { type: 'resolve' } ) );
					} );
				},
			},
		} );

		// Trigger resolution
		select( 'resolveStore2' ).selectAll( 'check' );

		setTimeout( () => {
			expect( select( 'resolveStore2' ).selectAll( 'check' ) ).toBe( 'yes' );
			resolveSelector( 'resolveStore2', 'selectAll', 'check' ).then( ( value ) => {
				expect( value ).toBe( 'yes' );
				done();
			} );
		}, 100 );

		jest.runAllTimers();
	} );
} );
