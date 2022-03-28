/**
 * Internal dependencies
 */
import { createRegistry, controls } from '..';

jest.useRealTimers();

describe( 'controls', () => {
	// Create a registry with store to test select controls.
	function createSelectTestRegistry() {
		const registry = createRegistry();

		// State is initially null and can receive data.
		// Typical for fetching data from remote locations.
		const reducer = ( state = null, action ) => {
			switch ( action.type ) {
				case 'RECEIVE':
					return action.data;
				default:
					return state;
			}
		};

		// Select state both without and with a resolver.
		const selectors = {
			selectorWithoutResolver: ( state ) => state,
			selectorWithResolver: ( state ) => state,
		};

		// The resolver receives data after a little delay.
		const resolvers = {
			*selectorWithResolver() {
				yield new Promise( ( r ) => setTimeout( r, 10 ) );
				return { type: 'RECEIVE', data: 'resolved-data' };
			},
		};

		// actions that call the tested controls and return the selected value.
		const actions = {
			*resolveWithoutResolver() {
				const value = yield controls.resolveSelect(
					'test/select',
					'selectorWithoutResolver'
				);
				return value;
			},
			*resolveWithResolver() {
				const value = yield controls.resolveSelect(
					'test/select',
					'selectorWithResolver'
				);
				return value;
			},
			*selectWithoutResolver() {
				const value = yield controls.select(
					'test/select',
					'selectorWithoutResolver'
				);
				return value;
			},
			*selectWithResolver() {
				const value = yield controls.select(
					'test/select',
					'selectorWithResolver'
				);
				return value;
			},
		};

		registry.registerStore( 'test/select', {
			reducer,
			actions,
			selectors,
			resolvers,
		} );

		return registry;
	}

	describe( 'resolveSelect', () => {
		it( 'invokes selector without a resolver', async () => {
			const registry = createSelectTestRegistry();
			const value = await registry
				.dispatch( 'test/select' )
				.resolveWithoutResolver();
			// Returns the state value without waiting for any resolver.
			expect( value ).toBe( null );
		} );

		it( 'resolves selector with a resolver', async () => {
			const registry = createSelectTestRegistry();
			const value = await registry
				.dispatch( 'test/select' )
				.resolveWithResolver();
			// Waits for the resolver to resolve and returns the resolved data.
			// Never returns the initial `null` state.
			expect( value ).toBe( 'resolved-data' );
		} );
	} );

	describe( 'select', () => {
		it( 'invokes selector without a resolver', async () => {
			const registry = createSelectTestRegistry();
			const value = await registry
				.dispatch( 'test/select' )
				.selectWithoutResolver();
			// Returns the state value without waiting for any resolver.
			expect( value ).toBe( null );
		} );

		it( 'invokes selector with a resolver', async () => {
			const registry = createSelectTestRegistry();
			// Check that the action with a control returns the initial state
			// without waiting for any resolver.
			const value = await registry
				.dispatch( 'test/select' )
				.selectWithResolver();
			expect( value ).toBe( null );

			// Check that re-running the action immediately still returns
			// the initial state, as the resolution is still running.
			const value2 = await registry
				.dispatch( 'test/select' )
				.selectWithResolver();
			expect( value2 ).toBe( null );
		} );
	} );

	describe( 'dispatch', () => {
		function createDispatchTestRegistry() {
			const registry = createRegistry();

			// Store stores a counter that can be incremented.
			const reducer = ( state = 0, action ) => {
				switch ( action.type ) {
					case 'INC':
						return state + 1;
					default:
						return state;
				}
			};

			const actions = {
				// increment the counter.
				inc() {
					return { type: 'INC' };
				},
				// Increment the counter twice in an async routine with controls.
				*doubleInc() {
					yield controls.dispatch( 'test/dispatch', 'inc' );
					yield controls.dispatch( 'test/dispatch', 'inc' );
				},
			};

			const selectors = {
				get: ( state ) => state,
			};

			registry.registerStore( 'test/dispatch', {
				reducer,
				actions,
				selectors,
			} );

			return registry;
		}

		it( 'invokes dispatch action', async () => {
			const registry = createDispatchTestRegistry();
			expect( registry.select( 'test/dispatch' ).get() ).toBe( 0 );
			await registry.dispatch( 'test/dispatch' ).doubleInc();
			expect( registry.select( 'test/dispatch' ).get() ).toBe( 2 );
		} );
	} );
} );
