/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withDispatch from '../';
import { createRegistry } from '../../../registry';
import { RegistryProvider } from '../../registry-provider';

describe( 'withDispatch', () => {
	const storeOptions = {
		reducer: ( state = 0, action ) => {
			if ( action.type === 'inc' ) {
				return state + action.count;
			}
			return state;
		},
		actions: {
			increment: ( count = 1 ) => ( { type: 'inc', count } ),
		},
		selectors: {
			getCount: ( state ) => state,
		},
	};

	it( 'passes the relevant data to the component', async () => {
		const user = userEvent.setup();
		const registry = createRegistry();
		registry.registerStore( 'counter', storeOptions );

		const ButtonSpy = jest.fn( ( { onClick } ) => (
			<button onClick={ onClick } />
		) );
		const Button = memo( ButtonSpy );

		const Component = withDispatch( ( dispatch, ownProps ) => {
			const { count } = ownProps;

			return {
				increment: () => {
					const actionReturnedFromDispatch = Promise.resolve(
						dispatch( 'counter' ).increment( count )
					);
					return expect(
						actionReturnedFromDispatch
					).resolves.toEqual( {
						type: 'inc',
						count,
					} );
				},
			};
		} )( ( props ) => (
			<Button __next40pxDefaultSize onClick={ props.increment } />
		) );

		const { rerender } = render(
			<RegistryProvider value={ registry }>
				<Component count={ 0 } />
			</RegistryProvider>
		);

		// Verify that dispatch respects props at the time of being invoked by
		// changing props after the initial mount.
		rerender(
			<RegistryProvider value={ registry }>
				<Component count={ 2 } />
			</RegistryProvider>
		);

		// Function value reference should not have changed in props update.
		// The spy method is only called during inital render.
		expect( ButtonSpy ).toHaveBeenCalledTimes( 1 );

		await user.click( screen.getByRole( 'button' ) );
		expect( registry.select( 'counter' ).getCount() ).toBe( 2 );
	} );

	it( 'calls dispatch on the correct registry if updated', async () => {
		const user = userEvent.setup();

		const firstRegistry = createRegistry();
		firstRegistry.registerStore( 'demo', storeOptions );

		const secondRegistry = createRegistry();
		secondRegistry.registerStore( 'demo', storeOptions );

		const Component = withDispatch( ( dispatch ) => {
			return {
				increment() {
					dispatch( 'demo' ).increment();
				},
			};
		} )( ( props ) => <button onClick={ props.increment } /> );

		const { rerender } = render(
			<RegistryProvider value={ firstRegistry }>
				<Component />
			</RegistryProvider>
		);

		await user.click( screen.getByRole( 'button' ) );
		expect( firstRegistry.select( 'demo' ).getCount() ).toBe( 1 );
		expect( secondRegistry.select( 'demo' ).getCount() ).toBe( 0 );

		rerender(
			<RegistryProvider value={ secondRegistry }>
				<Component />
			</RegistryProvider>
		);
		await user.click( screen.getByRole( 'button' ) );
		expect( firstRegistry.select( 'demo' ).getCount() ).toBe( 1 );
		expect( secondRegistry.select( 'demo' ).getCount() ).toBe( 1 );
	} );

	it( 'always calls select with the latest state in the handler passed to the component', async () => {
		const user = userEvent.setup();
		const registry = createRegistry();
		registry.registerStore( 'counter', storeOptions );

		const Component = withDispatch( ( dispatch, ownProps, { select } ) => {
			return {
				update: () => {
					const currentCount = select( 'counter' ).getCount();
					dispatch( 'counter' ).increment( currentCount + 1 );
				},
			};
		} )( ( props ) => <button onClick={ props.update } /> );

		render(
			<RegistryProvider value={ registry }>
				<Component />
			</RegistryProvider>
		);

		await user.click( screen.getByRole( 'button' ) );
		// expectedValue = 2 * currentValue + 1.
		expect( registry.select( 'counter' ).getCount() ).toBe( 1 );

		await user.click( screen.getByRole( 'button' ) );
		expect( registry.select( 'counter' ).getCount() ).toBe( 3 );

		await user.click( screen.getByRole( 'button' ) );
		expect( registry.select( 'counter' ).getCount() ).toBe( 7 );
	} );

	it( 'warns when mapDispatchToProps returns non-function property', () => {
		const registry = createRegistry();
		const Component = withDispatch( () => {
			return {
				count: 3,
			};
		} )( () => null );

		render(
			<RegistryProvider value={ registry }>
				<Component />
			</RegistryProvider>
		);

		expect( console ).toHaveWarnedWith(
			'Property count returned from dispatchMap in useDispatchWithMap must be a function.'
		);
	} );
} );
