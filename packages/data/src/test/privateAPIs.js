/**
 * Internal dependencies
 */
import { createRegistry } from '../registry';
import createReduxStore from '../redux-store';
import { unlock } from '../lock-unlock';
import { createRegistrySelector } from '../factory';

describe( 'Private data APIs', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistry();
	} );

	function getPublicPrice( state ) {
		return state.price;
	}
	function getSecretDiscount( state ) {
		return state.secretDiscount;
	}
	function setSecretDiscount( price ) {
		return { type: 'SET_PRIVATE_PRICE', price };
	}

	function setPublicPrice( price ) {
		return { type: 'SET_PUBLIC_PRICE', price };
	}
	const storeName = 'grocer';
	const storeDescriptor = {
		selectors: {
			getPublicPrice,
			getState: ( state ) => state,
		},
		actions: { setPublicPrice },
		reducer: ( state = { price: 1000, secretDiscount: 800 }, action ) => {
			if ( action.type === 'SET_PRIVATE_PRICE' ) {
				return {
					...state,
					secretDiscount: action.price,
				};
			} else if ( action.type === 'SET_PUBLIC_PRICE' ) {
				return {
					...state,
					price: action.price,
				};
			}
			return state;
		},
	};
	function createStore() {
		const groceryStore = createReduxStore( storeName, storeDescriptor );
		registry.register( groceryStore );
		return groceryStore;
	}

	describe( 'private selectors', () => {
		it( 'should expose public selectors by default', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateSelectors( groceryStore, {
				getSecretDiscount,
			} );

			const publicSelectors = registry.select( groceryStore );
			expect( publicSelectors.getPublicPrice ).toEqual(
				expect.any( Function )
			);
		} );

		it( 'should not expose private selectors by default', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateSelectors( {
				getSecretDiscount,
			} );

			const publicSelectors = registry.select( groceryStore );
			expect( publicSelectors.getSecretDiscount ).toEqual( undefined );
		} );

		it( 'should make private selectors available via unlock()', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateSelectors( {
				getSecretDiscount,
			} );

			const privateSelectors = unlock( registry.select( groceryStore ) );
			expect( privateSelectors.getSecretDiscount ).toEqual(
				expect.any( Function )
			);
			// The public selector is still accessible:
			expect( privateSelectors.getPublicPrice ).toEqual(
				expect.any( Function )
			);
		} );

		it( 'should support combination of private selectors and resolvers', async () => {
			const testStore = createReduxStore( 'test', {
				reducer: ( state = {}, action ) => {
					if ( action.type === 'RECEIVE' ) {
						return { ...state, [ action.key ]: action.value };
					}
					return state;
				},
				selectors: {
					get: ( state, key ) => state[ key ],
				},
				resolvers: {
					get:
						( key ) =>
						async ( { dispatch } ) => {
							const value = await ( 'resolved-' + key );
							dispatch( { type: 'RECEIVE', key, value } );
						},
				},
			} );
			unlock( testStore ).registerPrivateSelectors( {
				peek: ( state, key ) => state[ key ],
			} );
			registry.register( testStore );

			await registry.resolveSelect( testStore ).get( 'x' );
			expect( unlock( registry.select( testStore ) ).peek( 'x' ) ).toBe(
				'resolved-x'
			);
		} );

		it( 'should give private selectors access to the state', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateSelectors( {
				getSecretDiscount,
			} );

			const privateSelectors = unlock( registry.select( groceryStore ) );
			expect( privateSelectors.getSecretDiscount() ).toEqual( 800 );
		} );

		it( 'should support public selectors accessed via unlock()', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateSelectors( {
				getSecretDiscount,
			} );

			const unlockedSelectors = unlock( registry.select( groceryStore ) );
			expect( unlockedSelectors.getPublicPrice() ).toEqual( 1000 );
		} );

		it( 'should return stable references to selectors', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateSelectors( {
				getSecretDiscount,
			} );
			const select = unlock( registry.select( groceryStore ) );
			expect( select.getPublicPrice ).toBe( select.getPublicPrice );
			expect( select.getSecretDiscount ).toBe( select.getSecretDiscount );
		} );

		it( 'should support registerStore', () => {
			const groceryStore = registry.registerStore(
				storeName,
				storeDescriptor
			);
			unlock( groceryStore ).registerPrivateSelectors( {
				getSecretDiscount,
			} );

			const privateSelectors = unlock( registry.select( storeName ) );
			expect( privateSelectors.getSecretDiscount() ).toEqual( 800 );
		} );

		it( 'should support mixing createReduxStore and registerStore', () => {
			createReduxStore( storeName, storeDescriptor );
			const groceryStore2 = registry.registerStore(
				storeName,
				storeDescriptor
			);
			unlock( groceryStore2 ).registerPrivateSelectors( {
				getSecretDiscount,
			} );

			const privateSelectors = unlock( registry.select( storeName ) );
			expect( privateSelectors.getSecretDiscount() ).toEqual( 800 );
		} );

		it( 'should support sub registries', () => {
			const groceryStore = registry.registerStore(
				storeName,
				storeDescriptor
			);
			unlock( groceryStore ).registerPrivateSelectors( {
				getSecretDiscount,
			} );
			const subRegistry = createRegistry( {}, registry );
			subRegistry.registerStore( storeName, storeDescriptor );

			const parentPrivateSelectors = unlock(
				registry.select( storeName )
			);
			expect( parentPrivateSelectors.getSecretDiscount() ).toEqual( 800 );

			const subPrivateSelectors = unlock(
				subRegistry.select( storeName )
			);
			expect( subPrivateSelectors.getSecretDiscount() ).toEqual( 800 );
		} );

		it( 'should support private registry selectors', () => {
			const groceryStore = createStore();
			const otherStore = createReduxStore( 'other', {
				reducer: ( state = {} ) => state,
			} );
			unlock( otherStore ).registerPrivateSelectors( {
				getPrice: createRegistrySelector(
					( select ) => () => select( groceryStore ).getPublicPrice()
				),
			} );
			registry.register( otherStore );
			const privateSelectors = unlock( registry.select( otherStore ) );
			expect( privateSelectors.getPrice() ).toEqual( 1000 );
		} );

		it( 'should support calling a private registry selector from a public selector', () => {
			const groceryStore = createStore();
			const getPriceWithShipping = createRegistrySelector(
				( select ) => () => select( groceryStore ).getPublicPrice() + 5
			);
			const store = createReduxStore( 'a', {
				reducer: ( state = {} ) => state,
				selectors: {
					getPriceWithShippingAndTax: ( state ) =>
						getPriceWithShipping( state ) * 1.1,
				},
			} );
			unlock( store ).registerPrivateSelectors( {
				getPriceWithShipping,
			} );
			registry.register( store );
			expect(
				registry.select( store ).getPriceWithShippingAndTax()
			).toEqual( 1105.5 );
		} );
	} );

	describe( 'private actions', () => {
		it( 'should expose public actions by default', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateActions( groceryStore, {
				setSecretDiscount,
			} );
			const publicActions = registry.dispatch( groceryStore );
			expect( publicActions.setPublicPrice ).toEqual(
				expect.any( Function )
			);
		} );

		it( 'should not expose private actions by default', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateActions( {
				setSecretDiscount,
			} );
			const publicActions = registry.dispatch( groceryStore );
			expect( publicActions.setSecretDiscount ).toEqual( undefined );
		} );

		it( 'should make private actions available via unlock)', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateActions( {
				setSecretDiscount,
			} );
			const privateActions = unlock( registry.dispatch( groceryStore ) );
			expect( privateActions.setSecretDiscount ).toEqual(
				expect.any( Function )
			);
			// The public action is still accessible:
			expect( privateActions.setPublicPrice ).toEqual(
				expect.any( Function )
			);
		} );

		it( 'should work with both private actions and private selectors at the same time', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateActions( {
				setSecretDiscount,
			} );
			unlock( groceryStore ).registerPrivateSelectors( {
				getSecretDiscount,
			} );
			const privateActions = unlock( registry.dispatch( groceryStore ) );
			const privateSelectors = unlock( registry.select( groceryStore ) );
			expect( privateActions.setSecretDiscount ).toEqual(
				expect.any( Function )
			);
			expect( privateSelectors.getSecretDiscount ).toEqual(
				expect.any( Function )
			);
		} );

		it( 'should dispatch private actions like regular actions', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateActions( {
				setSecretDiscount,
			} );
			const privateActions = unlock( registry.dispatch( groceryStore ) );
			privateActions.setSecretDiscount( 400 );
			expect(
				registry.select( groceryStore ).getState().secretDiscount
			).toEqual( 400 );
		} );

		it( 'should return stable references to actions', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateActions( {
				setSecretDiscount,
			} );
			const disp = unlock( registry.dispatch( groceryStore ) );
			expect( disp.setPublicPrice ).toBe( disp.setPublicPrice );
			expect( disp.setSecretDiscount ).toBe( disp.setSecretDiscount );
		} );

		it( 'should dispatch public actions on the unlocked store', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateActions( {
				setSecretDiscount,
			} );
			const privateActions = unlock( registry.dispatch( groceryStore ) );
			privateActions.setPublicPrice( 400 );
			expect( registry.select( groceryStore ).getState().price ).toEqual(
				400
			);
		} );

		it( 'should dispatch private action thunks like regular actions', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateActions( {
				setSecretDiscountThunk:
					( price ) =>
					( { dispatch } ) => {
						dispatch( { type: 'SET_PRIVATE_PRICE', price } );
					},
			} );
			unlock( groceryStore ).registerPrivateSelectors( {
				getSecretDiscount,
			} );
			const privateActions = unlock( registry.dispatch( groceryStore ) );
			privateActions.setSecretDiscountThunk( 100 );
			expect(
				unlock( registry.select( groceryStore ) ).getSecretDiscount()
			).toEqual( 100 );
		} );

		it( 'should expose unlocked private selectors and actions to thunks', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateSelectors( {
				getSecretDiscount,
			} );
			unlock( groceryStore ).registerPrivateActions( {
				setSecretDiscount,
				doubleSecretDiscount() {
					return ( { dispatch, select } ) => {
						dispatch.setSecretDiscount(
							select.getSecretDiscount() * 2
						);
					};
				},
			} );
			const privateActions = unlock( registry.dispatch( groceryStore ) );
			privateActions.setSecretDiscount( 100 );
			privateActions.doubleSecretDiscount();
			expect(
				unlock( registry.select( groceryStore ) ).getSecretDiscount()
			).toEqual( 200 );
		} );

		it( 'should support registerStore', () => {
			const groceryStore = registry.registerStore(
				storeName,
				storeDescriptor
			);
			unlock( groceryStore ).registerPrivateActions( {
				setSecretDiscount,
			} );
			const privateActions = unlock( registry.dispatch( storeName ) );
			privateActions.setSecretDiscount( 400 );
			expect(
				registry.select( storeName ).getState().secretDiscount
			).toEqual( 400 );
		} );

		it( 'should support sub registries', () => {
			const groceryStore = createStore();
			unlock( groceryStore ).registerPrivateSelectors( {
				getSecretDiscount,
			} );
			unlock( groceryStore ).registerPrivateActions( {
				setSecretDiscount,
			} );
			const subRegistry = createRegistry( {}, registry );
			subRegistry.registerStore( storeName, storeDescriptor );

			const parentPrivateActions = unlock(
				registry.dispatch( storeName )
			);
			const parentPrivateSelectors = unlock(
				registry.select( storeName )
			);

			const subPrivateActions = unlock(
				subRegistry.dispatch( storeName )
			);
			const subPrivateSelectors = unlock(
				subRegistry.select( storeName )
			);

			parentPrivateActions.setSecretDiscount( 400 );
			subPrivateActions.setSecretDiscount( 478 );

			expect( parentPrivateSelectors.getSecretDiscount() ).toEqual( 400 );
			expect( subPrivateSelectors.getSecretDiscount() ).toEqual( 478 );
		} );
	} );
} );
