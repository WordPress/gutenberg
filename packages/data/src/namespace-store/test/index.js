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
} );
