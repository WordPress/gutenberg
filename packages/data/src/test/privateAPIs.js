/**
 * Internal dependencies
 */
import { createRegistry } from '../registry';
import createReduxStore from '../redux-store';
/**
 * WordPress dependencies
 */
import {
	experimentId,
	__dangerousOptInToUnstableAPIsOnlyForCoreModules,
} from '@wordpress/experiments';

const { lock, unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.',
	'@wordpress/data'
);

beforeEach( () => {
	jest.useFakeTimers( 'legacy' );
} );

afterEach( () => {
	jest.runOnlyPendingTimers();
	jest.useRealTimers();
} );

describe( 'Private data APIs', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistry();
	} );

	describe( 'private selectors', () => {
		function getPublicPrice( state ) {
			return state.price;
		}
		function getPrivatePrice( state ) {
			return state.secretDiscount;
		}
		function createStore() {
			const groceryStore = createReduxStore( 'grocer', {
				selectors: {
					getPublicPrice,
				},
				actions: {},
				reducer: () => {
					return {
						price: 1000,
						secretDiscount: 800,
					};
				},
			} );
			registry.register( groceryStore );
			return groceryStore;
		}

		it( 'should expose public selectors by default', () => {
			const groceryStore = createStore();
			lock( groceryStore, { selectors: { getPrivatePrice } } );

			const publicSelectors = registry.select( groceryStore );
			expect( publicSelectors.getPublicPrice ).toEqual(
				expect.any( Function )
			);
		} );

		it( 'should not expose private selectors by default', () => {
			const groceryStore = createStore();
			lock( groceryStore, { selectors: { getPrivatePrice } } );

			const publicSelectors = registry.select( groceryStore );
			expect( publicSelectors.getPrivatePrice ).toEqual( undefined );
		} );

		it( 'should contain the `experiments` key', () => {
			const groceryStore = createStore();
			lock( groceryStore, { selectors: { getPrivatePrice } } );

			const publicSelectors = registry.select( groceryStore );
			expect( experimentId in publicSelectors ).toBeTruthy();
		} );

		it( 'should make private selectors available via unlock()', () => {
			const groceryStore = createStore();
			lock( groceryStore, { selectors: { getPrivatePrice } } );

			const privateSelectors = unlock( registry.select( groceryStore ) );
			expect( privateSelectors.getPrivatePrice ).toEqual(
				expect.any( Function )
			);
		} );

		it( 'should give private selectors access to the state', () => {
			const groceryStore = createStore();
			lock( groceryStore, { selectors: { getPrivatePrice } } );

			const privateSelectors = unlock( registry.select( groceryStore ) );
			expect( privateSelectors.getPrivatePrice() ).toEqual( 800 );
		} );

		it( 'should throw a clear error when if private selectors are found in the unlock() call', () => {
			const groceryStore = createStore();
			// Forgot to wrap the `getPrivatePrice` in a { selectors: {} } object:
			lock( groceryStore, { getPrivatePrice } );

			expect( () =>
				unlock( registry.select( groceryStore ) )
			).toThrowError( /no experimental selectors were defined/ );
		} );
	} );

	describe( 'private actions', () => {
		function setPrivatePrice( price ) {
			return { type: 'SET_PRIVATE_PRICE', price };
		}

		function setPublicPrice( price ) {
			return { type: 'SET_PUBLIC_PRICE', price };
		}

		function createStore() {
			const groceryStore = createReduxStore( 'grocer', {
				selectors: {
					getPrivatePrice( state ) {
						return state.secretDiscount;
					},
				},
				actions: { setPublicPrice },
				reducer: ( state, action ) => {
					if ( action?.type === 'SET_PRIVATE_PRICE' ) {
						return {
							...state,
							secretDiscount: action?.price,
						};
					}
					return {
						price: 1000,
						secretDiscount: 800,
						...( state || {} ),
					};
				},
			} );
			registry.register( groceryStore );
			return groceryStore;
		}

		it( 'should expose public actions by default', () => {
			const groceryStore = createStore();
			lock( groceryStore, {
				actions: {
					setPrivatePrice,
				},
			} );
			const publicActions = registry.dispatch( groceryStore );
			expect( publicActions.setPublicPrice ).toEqual(
				expect.any( Function )
			);
		} );

		it( 'should not expose private actions by default', () => {
			const groceryStore = createStore();
			lock( groceryStore, {
				actions: {
					setPrivatePrice,
				},
			} );
			const publicActions = registry.dispatch( groceryStore );
			expect( publicActions.setPrivatePrice ).toEqual( undefined );
		} );

		it( 'should contain the `experiments` key', () => {
			const groceryStore = createStore();
			lock( groceryStore, {
				actions: {
					setPrivatePrice,
				},
			} );
			const publicActions = registry.dispatch( groceryStore );
			expect( experimentId in publicActions ).toBeTruthy();
		} );

		it( 'should make private actions available via unlock()', () => {
			const groceryStore = createStore();
			lock( groceryStore, {
				actions: {
					setPrivatePrice,
				},
			} );
			const privateActions = unlock( registry.dispatch( groceryStore ) );
			expect( privateActions.setPrivatePrice ).toEqual(
				expect.any( Function )
			);
		} );

		it( 'should dispatch private actions like regular actions', () => {
			const groceryStore = createStore();
			lock( groceryStore, {
				actions: {
					setPrivatePrice,
				},
			} );
			const privateActions = unlock( registry.dispatch( groceryStore ) );
			privateActions.setPrivatePrice( 400 );
			expect( registry.select( groceryStore ).getPrivatePrice() ).toEqual(
				400
			);
		} );

		it( 'should dispatch private action thunks like regular actions', () => {
			const groceryStore = createStore();
			lock( groceryStore, {
				actions: {
					setPrivatePriceThunk:
						( price ) =>
						( { dispatch } ) => {
							dispatch( { type: 'SET_PRIVATE_PRICE', price } );
						},
				},
			} );
			const privateActions = unlock( registry.dispatch( groceryStore ) );
			privateActions.setPrivatePriceThunk( 100 );
			expect( registry.select( groceryStore ).getPrivatePrice() ).toEqual(
				100
			);
		} );

		it( 'should throw a clear error when if private actions are found in the unlock() call', () => {
			const groceryStore = createStore();
			// Forgot to wrap the `setPrivatePrice` in an { actions: {} } object:
			lock( groceryStore, { setPrivatePrice } );

			expect( () =>
				unlock( registry.dispatch( groceryStore ) )
			).toThrowError( /no experimental actions were defined/ );
		} );
	} );
} );
