/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { click, type } from '@ariakit/test';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SearchControl from '..';

function ControlledSearchControl( {
	onChange,
	...restProps
}: React.ComponentProps< typeof SearchControl > ) {
	const [ value, setValue ] = useState( '' );

	return (
		<SearchControl
			{ ...restProps }
			value={ value }
			onChange={ ( ...args ) => {
				setValue( ...args );
				onChange( ...args );
			} }
		/>
	);
}

describe( 'SearchControl', () => {
	describe.each( [
		// TODO: Uncontrolled mode is not supported yet.
		// [ 'Uncontrolled', SearchControl ],
		[ 'Controlled mode', ControlledSearchControl ],
	] )( '%s', ( ...modeAndComponent ) => {
		const [ , Component ] = modeAndComponent;

		it( 'should call onChange with input value when value is changed', async () => {
			const onChangeSpy = jest.fn();
			render( <Component onChange={ onChangeSpy } /> );

			const searchInput = screen.getByRole( 'searchbox' );
			await type( 'test', searchInput );
			expect( searchInput ).toHaveValue( 'test' );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( 'test' );
		} );

		it( 'should render a Reset search button if no onClose function is provided', async () => {
			const onChangeSpy = jest.fn();
			render( <Component onChange={ onChangeSpy } /> );

			const searchInput = screen.getByRole( 'searchbox' );

			expect(
				screen.queryByRole( 'button', { name: 'Reset search' } )
			).not.toBeInTheDocument();

			await type( 'test', searchInput );
			const resetButton = screen.getByRole( 'button', {
				name: 'Reset search',
			} );
			expect( resetButton ).toBeVisible();

			await click( resetButton );
			expect( searchInput ).toHaveValue( '' );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( '' );
		} );

		it( 'should should render a Close button (instead of Reset) when onClose function is provided', async () => {
			const onChangeSpy = jest.fn();
			const onCloseSpy = jest.fn();
			render(
				<Component onChange={ onChangeSpy } onClose={ onCloseSpy } />
			);

			expect(
				screen.queryByRole( 'button', { name: 'Close search' } )
			).toBeVisible();
			expect(
				screen.queryByRole( 'button', { name: 'Reset search' } )
			).not.toBeInTheDocument();

			const searchInput = screen.getByRole( 'searchbox' );
			await type( 'test', searchInput );

			expect(
				screen.queryByRole( 'button', { name: 'Close search' } )
			).toBeVisible();
			expect(
				screen.queryByRole( 'button', { name: 'Reset search' } )
			).not.toBeInTheDocument();
			expect( onChangeSpy ).toHaveBeenCalledTimes( 'test'.length );

			await click(
				screen.getByRole( 'button', { name: 'Close search' } )
			);
			expect( onCloseSpy ).toHaveBeenCalledTimes( 1 );
			expect( searchInput ).toHaveValue( 'test' ); // no change
			expect( onChangeSpy ).toHaveBeenCalledTimes( 'test'.length ); // no change
		} );
	} );
} );
