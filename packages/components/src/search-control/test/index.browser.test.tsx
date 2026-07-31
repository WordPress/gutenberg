import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
import { useState } from '@wordpress/element';
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
			const onChangeSpy = vi.fn();
			render( <Component onChange={ onChangeSpy } /> );

			const searchInput = screen.getByRole( 'searchbox' );
			await userEvent.type( searchInput, 'test' );
			expect( searchInput ).toHaveValue( 'test' );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( 'test' );
		} );

		it( 'should render a Reset search button if no onClose function is provided', async () => {
			const onChangeSpy = vi.fn();
			render( <Component onChange={ onChangeSpy } /> );

			const searchInput = screen.getByRole( 'searchbox' );

			expect(
				screen.queryByRole( 'button', { name: 'Reset search' } )
			).not.toBeInTheDocument();
			const paddingInlineEndWithoutSuffix =
				getComputedStyle( searchInput ).paddingInlineEnd;

			await userEvent.type( searchInput, 'test' );
			const resetButton = screen.getByRole( 'button', {
				name: 'Reset search',
			} );
			expect( resetButton ).toBeVisible();
			expect( getComputedStyle( searchInput ).paddingInlineEnd ).not.toBe(
				paddingInlineEndWithoutSuffix
			);

			await userEvent.click( resetButton );
			expect( searchInput ).toHaveValue( '' );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( '' );
			expect( getComputedStyle( searchInput ).paddingInlineEnd ).toBe(
				paddingInlineEndWithoutSuffix
			);
		} );

		it( 'should render a Close button (instead of Reset) when onClose function is provided', async () => {
			const onChangeSpy = vi.fn();
			const onCloseSpy = vi.fn();
			render(
				<Component onChange={ onChangeSpy } onClose={ onCloseSpy } />
			);

			expect( console ).toHaveWarnedWith(
				'`onClose` prop in wp.components.SearchControl is deprecated since version 6.8.'
			);
			expect(
				screen.queryByRole( 'button', { name: 'Close search' } )
			).toBeVisible();
			expect(
				screen.queryByRole( 'button', { name: 'Reset search' } )
			).not.toBeInTheDocument();

			const searchInput = screen.getByRole( 'searchbox' );
			await userEvent.type( searchInput, 'test' );

			expect(
				screen.queryByRole( 'button', { name: 'Close search' } )
			).toBeVisible();
			expect(
				screen.queryByRole( 'button', { name: 'Reset search' } )
			).not.toBeInTheDocument();
			expect( onChangeSpy ).toHaveBeenCalledTimes( 'test'.length );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'Close search' } )
			);
			expect( onCloseSpy ).toHaveBeenCalledTimes( 1 );
			expect( searchInput ).toHaveValue( 'test' ); // no change
			expect( onChangeSpy ).toHaveBeenCalledTimes( 'test'.length ); // no change
		} );
	} );
} );
