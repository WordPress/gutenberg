/**
 * External dependencies
 */
import isPromise from 'is-promise';

/**
 * Internal dependencies
 */
import { createRegistry } from '../../registry';
import { createRegistryControl } from '../../factory';

describe( 'controls', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistry();
	} );

	describe( 'should call registry-aware controls', () => {
		it( 'registers multiple selectors to the public API', () => {
			const action1 = jest.fn( () => ( { type: 'NOTHING' } ) );
			const action2 = function * () {
				yield { type: 'DISPATCH', store: 'store1', action: 'action1' };
			};
			registry.registerStore( 'store1', {
				reducer: () => 'state1',
				actions: {
					action1,
				},
			} );
			registry.registerStore( 'store2', {
				reducer: () => 'state2',
				actions: {
					action2,
				},
				controls: {
					DISPATCH: createRegistryControl( ( reg ) => ( { store, action } ) => {
						return reg.dispatch( store )[ action ]();
					} ),
				},
			} );

			registry.dispatch( 'store2' ).action2();
			expect( action1 ).toBeCalled();
		} );
	} );

	it( 'resolves in expected order', ( done ) => {
		const actions = {
			wait: () => ( { type: 'WAIT' } ),
			receive: ( items ) => ( { type: 'RECEIVE', items } ),
		};

		registry.registerStore( 'store', {
			reducer: ( state = null, action ) => {
				if ( action.type === 'RECEIVE' ) {
					return action.items;
				}

				return state;
			},
			selectors: {
				getItems: ( state ) => state,
			},
			resolvers: {
				* getItems() {
					yield actions.wait();
					yield actions.receive( [ 1, 2, 3 ] );
				},
			},
			controls: {
				WAIT() {
					return new Promise( ( resolve ) => process.nextTick( resolve ) );
				},
			},
		} );

		registry.subscribe( () => {
			const isFinished = registry.select( 'store' ).hasFinishedResolution( 'getItems' );
			if ( isFinished ) {
				expect( registry.select( 'store' ).getItems() ).toEqual( [ 1, 2, 3 ] );
				done();
			}
		} );

		registry.select( 'store' ).getItems();
	} );
	it( 'returns undefined when action is dispatched unless it is a ' +
		'promise', () => {
		const actions = {
			withPromise: () => new Promise( ( resolve ) => resolve( {} ) ),
			normal: () => ( { type: 'NORMAL' } ),
		};
		registry.registerStore( 'store', {
			reducer: () => {},
			actions,
		} );
		expect( isPromise( registry.dispatch( 'store' ).withPromise() ) )
			.toBe( true );
		expect( registry.dispatch( 'store' ).normal() ).toBeUndefined();
	} );
} );
