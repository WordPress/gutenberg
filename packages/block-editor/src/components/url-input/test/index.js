/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import URLInput from '../index';

// Mock the compose HOCs to simplify testing
jest.mock( '@wordpress/compose', () => ( {
	compose:
		( ...fns ) =>
		( Component ) =>
			fns.reduceRight( ( acc, fn ) => fn( acc ), Component ),
	debounce: ( fn ) => fn,
	withInstanceId: ( Component ) => ( props ) => (
		<Component { ...props } instanceId={ 1 } />
	),
	withSafeTimeout: ( Component ) => Component,
} ) );

jest.mock( '@wordpress/data', () => ( {
	withSelect: () => ( Component ) => Component,
} ) );

jest.mock( '@wordpress/components', () => {
	const actual = jest.requireActual( '@wordpress/components' );
	return {
		...actual,
		privateApis: {
			ValidatedInputControl: actual.ValidatedInputControl,
		},
	};
} );

describe( 'URLInput with validation', () => {
	it( 'should show validation error when customValidity is set to invalid', async () => {
		const user = userEvent.setup();
		const onChangeMock = jest.fn();

		function TestURLInput() {
			const [ url, setUrl ] = useState( '' );
			const [ customValidity, setCustomValidity ] = useState( undefined );

			return (
				<URLInput
					value={ url }
					onChange={ ( newUrl ) => {
						setUrl( newUrl );
						onChangeMock( newUrl );
						// Set validation based on value
						if ( newUrl?.toLowerCase() === 'error' ) {
							setCustomValidity( {
								type: 'invalid',
								message: 'The word "error" is not allowed.',
							} );
						} else {
							setCustomValidity( undefined );
						}
					} }
					customValidity={ customValidity }
				/>
			);
		}

		render( <TestURLInput /> );

		const urlField = screen.getByRole( 'combobox' );

		// Type "error" to trigger validation
		await user.type( urlField, 'error' );

		// Blur to trigger validation
		await user.tab();

		// Wait for validation error to appear
		await waitFor( () => {
			expect(
				screen.getByText( 'The word "error" is not allowed.' )
			).toBeInTheDocument();
		} );
	} );

	it( 'should clear validation error when value becomes valid', async () => {
		const user = userEvent.setup();
		const onChangeMock = jest.fn();

		function TestURLInput() {
			const [ url, setUrl ] = useState( '' );
			const [ customValidity, setCustomValidity ] = useState( undefined );

			return (
				<URLInput
					value={ url }
					onChange={ ( newUrl ) => {
						setUrl( newUrl );
						onChangeMock( newUrl );
						// Set validation based on value
						if ( newUrl?.toLowerCase() === 'error' ) {
							setCustomValidity( {
								type: 'invalid',
								message: 'The word "error" is not allowed.',
							} );
						} else {
							setCustomValidity( undefined );
						}
					} }
					customValidity={ customValidity }
				/>
			);
		}

		render( <TestURLInput /> );

		const urlField = screen.getByRole( 'combobox' );

		// Type "error" to trigger validation
		await user.type( urlField, 'error' );
		await user.tab();

		// Wait for validation error
		await waitFor( () => {
			expect(
				screen.getByText( 'The word "error" is not allowed.' )
			).toBeInTheDocument();
		} );

		// Clear and type valid value
		await user.clear( urlField );
		await user.type( urlField, 'https://example.com' );
		await user.tab();

		// Error should be cleared
		await waitFor( () => {
			expect(
				screen.queryByText( 'The word "error" is not allowed.' )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'should work without validation props (backward compatibility)', async () => {
		const user = userEvent.setup();
		const onChangeMock = jest.fn();

		render(
			<URLInput
				value=""
				onChange={ onChangeMock }
				__experimentalFetchLinkSuggestions={ () =>
					Promise.resolve( [] )
				}
			/>
		);

		const urlField = screen.getByRole( 'combobox' );
		await user.type( urlField, 'https://example.com' );

		expect( onChangeMock ).toHaveBeenCalled();
	} );
} );
