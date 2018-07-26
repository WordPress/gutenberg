/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import withDispatch from '../';
import { createRegistry } from '../../../registry';
import RegistryProvider from '../../registry-provider';

describe( 'withDispatch', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
	} );

	it( 'passes the relevant data to the component', () => {
		const store = registry.registerStore( 'counter', {
			reducer: ( state = 0, action ) => {
				if ( action.type === 'increment' ) {
					return state + action.count;
				}
				return state;
			},
			actions: {
				increment: ( count = 1 ) => ( { type: 'increment', count } ),
			},
		} );

		const Component = withDispatch( ( _dispatch, ownProps ) => {
			const { count } = ownProps;

			return {
				increment: () => _dispatch( 'counter' ).increment( count ),
			};
		} )( ( props ) => <button onClick={ props.increment } /> );

		const testRenderer = TestRenderer.create(
			<RegistryProvider value={ registry }>
				<Component count={ 0 } />
			</RegistryProvider>
		);
		const testInstance = testRenderer.root;

		const incrementBeforeSetProps = testInstance.findByType( 'button' ).props.onClick;

		// Verify that dispatch respects props at the time of being invoked by
		// changing props after the initial mount.
		testRenderer.update(
			<RegistryProvider value={ registry }>
				<Component count={ 2 } />
			</RegistryProvider>
		);

		// Function value reference should not have changed in props update.
		expect( testInstance.findByType( 'button' ).props.onClick ).toBe( incrementBeforeSetProps );

		incrementBeforeSetProps();

		expect( store.getState() ).toBe( 2 );
	} );
} );
