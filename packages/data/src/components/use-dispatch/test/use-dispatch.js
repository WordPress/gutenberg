/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { createRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useDispatch from '../use-dispatch';
import createReduxStore from '../../../redux-store';
import { createRegistry } from '../../../registry';
import { RegistryProvider } from '../../registry-provider';

const noop = () => ( { type: '__INERT__' } );
const reducer = ( state ) => state;

jest.useRealTimers();

describe( 'useDispatch', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
	} );

	it( 'returns dispatch function from store with no store name provided', () => {
		registry.registerStore( 'demoStore', {
			reducer,
			actions: {
				foo: () => 'bar',
			},
		} );

		const result = createRef();
		const TestComponent = () => {
			const dispatch = useDispatch();

			useEffect( () => {
				result.current = dispatch;
			} );

			return null;
		};

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		expect( result.current ).toBe( registry.dispatch );
	} );

	it( 'returns expected action creators from store for given storeName', async () => {
		const user = userEvent.setup();
		const testAction = jest.fn().mockImplementation( noop );
		const store = createReduxStore( 'demoStore', {
			reducer,
			actions: {
				foo: testAction,
			},
		} );
		registry.register( store );

		const TestComponent = () => {
			const { foo } = useDispatch( store );
			return <button onClick={ foo } />;
		};

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		await user.click( screen.getByRole( 'button' ) );

		expect( testAction ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'returns expected action creators from store for given store descriptor', async () => {
		const user = userEvent.setup();
		const testAction = jest.fn().mockImplementation( noop );
		registry.registerStore( 'demoStore', {
			reducer,
			actions: {
				foo: testAction,
			},
		} );
		const TestComponent = () => {
			const { foo } = useDispatch( 'demoStore' );
			return <button onClick={ foo } />;
		};

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		await user.click( screen.getByRole( 'button' ) );

		expect( testAction ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'returns dispatch from correct registry if registries change', async () => {
		const user = userEvent.setup();
		const firstRegistryAction = jest.fn().mockImplementation( noop );
		const secondRegistryAction = jest.fn().mockImplementation( noop );

		const firstRegistry = createRegistry();
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

		const { rerender } = render(
			<RegistryProvider value={ firstRegistry }>
				<TestComponent />
			</RegistryProvider>
		);

		await user.click( screen.getByRole( 'button' ) );
		expect( firstRegistryAction ).toHaveBeenCalledTimes( 1 );
		expect( secondRegistryAction ).not.toHaveBeenCalled();

		firstRegistryAction.mockClear();

		const secondRegistry = createRegistry();
		secondRegistry.registerStore( 'demo', {
			reducer,
			actions: {
				noop: secondRegistryAction,
			},
		} );

		rerender(
			<RegistryProvider value={ secondRegistry }>
				<TestComponent />
			</RegistryProvider>
		);

		await user.click( screen.getByRole( 'button' ) );
		expect( firstRegistryAction ).not.toHaveBeenCalled();
		expect( secondRegistryAction ).toHaveBeenCalledTimes( 1 );
	} );
} );
