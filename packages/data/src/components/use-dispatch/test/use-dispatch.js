/**
 * External dependencies
 */
import TestRenderer, { act } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import useDispatch from '../use-dispatch';
import createReduxStore from '../../../redux-store';
import { createRegistry } from '../../../registry';
import { RegistryProvider } from '../../registry-provider';

describe( 'useDispatch', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
	} );

	it( 'returns dispatch function from store with no store name provided', () => {
		registry.registerStore( 'demoStore', {
			reducer: ( state ) => state,
			actions: {
				foo: () => 'bar',
			},
		} );
		const TestComponent = () => {
			return <div></div>;
		};
		const Component = () => {
			const dispatch = useDispatch();
			return <TestComponent dispatch={ dispatch } />;
		};

		let testRenderer;
		act( () => {
			testRenderer = TestRenderer.create(
				<RegistryProvider value={ registry }>
					<Component />
				</RegistryProvider>
			);
		} );

		const testInstance = testRenderer.root;

		expect( testInstance.findByType( TestComponent ).props.dispatch ).toBe(
			registry.dispatch
		);
	} );
	it( 'returns expected action creators from store for given storeName', () => {
		const noop = () => ( { type: '__INERT__' } );
		const testAction = jest.fn().mockImplementation( noop );
		const store = createReduxStore( 'demoStore', {
			reducer: ( state ) => state,
			actions: {
				foo: testAction,
			},
		} );
		registry.register( store );

		const TestComponent = () => {
			const { foo } = useDispatch( store );
			return <button onClick={ foo } />;
		};

		let testRenderer;

		act( () => {
			testRenderer = TestRenderer.create(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);
		} );

		const testInstance = testRenderer.root;

		act( () => {
			testInstance.findByType( 'button' ).props.onClick();
		} );

		expect( testAction ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'returns expected action creators from store for given store descriptor', () => {
		const noop = () => ( { type: '__INERT__' } );
		const testAction = jest.fn().mockImplementation( noop );
		registry.registerStore( 'demoStore', {
			reducer: ( state ) => state,
			actions: {
				foo: testAction,
			},
		} );
		const TestComponent = () => {
			const { foo } = useDispatch( 'demoStore' );
			return <button onClick={ foo } />;
		};

		let testRenderer;

		act( () => {
			testRenderer = TestRenderer.create(
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);
		} );

		const testInstance = testRenderer.root;

		act( () => {
			testInstance.findByType( 'button' ).props.onClick();
		} );

		expect( testAction ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'returns dispatch from correct registry if registries change', () => {
		const reducer = ( state ) => state;
		const noop = () => ( { type: '__INERT__' } );
		const firstRegistryAction = jest.fn().mockImplementation( noop );
		const secondRegistryAction = jest.fn().mockImplementation( noop );

		const firstRegistry = registry;
		firstRegistry.registerStore( 'demo', {
			reducer,
			actions: {
				noop: firstRegistryAction,
			},
		} );

		const TestComponent = () => {
			const dispatch = useDispatch();
			return <button onClick={ () => dispatch( 'demo' ).noop() } />;
		};

		let testRenderer;
		act( () => {
			testRenderer = TestRenderer.create(
				<RegistryProvider value={ firstRegistry }>
					<TestComponent />
				</RegistryProvider>
			);
		} );
		const testInstance = testRenderer.root;

		act( () => {
			testInstance.findByType( 'button' ).props.onClick();
		} );

		expect( firstRegistryAction ).toHaveBeenCalledTimes( 1 );
		expect( secondRegistryAction ).toHaveBeenCalledTimes( 0 );

		const secondRegistry = createRegistry();
		secondRegistry.registerStore( 'demo', {
			reducer,
			actions: {
				noop: secondRegistryAction,
			},
		} );

		act( () => {
			testRenderer.update(
				<RegistryProvider value={ secondRegistry }>
					<TestComponent />
				</RegistryProvider>
			);
		} );
		act( () => {
			testInstance.findByType( 'button' ).props.onClick();
		} );
		expect( firstRegistryAction ).toHaveBeenCalledTimes( 1 );
		expect( secondRegistryAction ).toHaveBeenCalledTimes( 1 );
	} );
} );
