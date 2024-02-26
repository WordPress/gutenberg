/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import useDispatch from '../use-dispatch';
import createReduxStore from '../../../redux-store';
import { createRegistry } from '../../../registry';
import { RegistryProvider } from '../../registry-provider';

describe( 'useDispatch', () => {
	const counterStore = {
		reducer: ( state = 0, action ) => {
			if ( action.type === 'INC' ) {
				return state + 1;
			}

			return state;
		},
		actions: {
			inc: () => ( { type: 'INC' } ),
		},
		selectors: {
			get: ( state ) => state,
		},
	};

	it( 'returns dispatch function from store with no store name provided', async () => {
		const user = userEvent.setup();
		const registry = createRegistry();
		registry.registerStore( 'demo', counterStore );

		const TestComponent = () => {
			const dispatch = useDispatch();
			return <button onClick={ () => dispatch( 'demo' ).inc() } />;
		};

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		await user.click( screen.getByRole( 'button' ) );

		expect( registry.select( 'demo' ).get() ).toBe( 1 );
	} );

	it( 'returns expected action creators from store for given store descriptor', async () => {
		const user = userEvent.setup();
		const store = createReduxStore( 'demoStore', counterStore );
		const registry = createRegistry();
		registry.register( store );

		const TestComponent = () => {
			const { inc } = useDispatch( store );
			return <button onClick={ inc } />;
		};

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		await user.click( screen.getByRole( 'button' ) );

		expect( registry.select( store ).get() ).toBe( 1 );
	} );

	it( 'returns expected action creators from store for given storeName', async () => {
		const user = userEvent.setup();
		const registry = createRegistry();
		registry.registerStore( 'demoStore', counterStore );
		const TestComponent = () => {
			const { inc } = useDispatch( 'demoStore' );
			return <button onClick={ inc } />;
		};

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		await user.click( screen.getByRole( 'button' ) );

		expect( registry.select( 'demoStore' ).get() ).toBe( 1 );
	} );

	it( 'returns dispatch from correct registry if registries change', async () => {
		const user = userEvent.setup();

		const firstRegistry = createRegistry();
		firstRegistry.registerStore( 'demo', counterStore );

		const secondRegistry = createRegistry();
		secondRegistry.registerStore( 'demo', counterStore );

		const TestComponent = () => {
			const dispatch = useDispatch();
			return <button onClick={ () => dispatch( 'demo' ).inc() } />;
		};

		const { rerender } = render(
			<RegistryProvider value={ firstRegistry }>
				<TestComponent />
			</RegistryProvider>
		);

		await user.click( screen.getByRole( 'button' ) );

		expect( firstRegistry.select( 'demo' ).get() ).toBe( 1 );
		expect( secondRegistry.select( 'demo' ).get() ).toBe( 0 );

		rerender(
			<RegistryProvider value={ secondRegistry }>
				<TestComponent />
			</RegistryProvider>
		);

		await user.click( screen.getByRole( 'button' ) );
		expect( firstRegistry.select( 'demo' ).get() ).toBe( 1 );
		expect( secondRegistry.select( 'demo' ).get() ).toBe( 1 );
	} );
} );
