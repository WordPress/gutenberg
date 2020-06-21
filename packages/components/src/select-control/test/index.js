/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import SelectControl from '../';

describe( 'SelectControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			const optionsProp = [
				{ label: 'One', value: 1 },
				{ label: 'Two', value: 2 },
				{ label: 'Three', value: 3 },
			];

			const { container } = render(
				<SelectControl options={ optionsProp } />
			);

			const select = container.querySelector( 'select' );

			expect( select ).toBeTruthy();
		} );

		it( 'should not render if options are empty render', () => {
			const optionsProp = [];

			const { container } = render(
				<SelectControl options={ optionsProp } />
			);

			const select = container.querySelector( 'select' );

			expect( select ).toBeFalsy();
		} );
	} );

	describe( 'Options', () => {
		it( 'should render with selected options', () => {
			const optionsProp = [
				{ label: 'One', value: 1 },
				{ label: 'Two', value: 2 },
				{ label: 'Three', value: 3 },
			];

			render( <SelectControl options={ optionsProp } value={ 3 } /> );

			const select = screen.getByDisplayValue( 'Three' );

			expect( select ).toBeTruthy();
		} );
	} );

	describe( 'Loading', () => {
		it( 'should render with loading placeholder and busy, if isLoading', () => {
			const optionsProp = [
				{ label: 'One', value: 1 },
				{ label: 'Two', value: 2 },
				{ label: 'Three', value: 3 },
			];

			const { container, rerender } = render(
				<SelectControl options={ optionsProp } isLoading={ true } />
			);

			expect( screen.getByText( /Loading/ ) ).toBeTruthy();
			expect(
				container.querySelector( '[aria-busy="true"]' )
			).toBeTruthy();

			rerender(
				<SelectControl options={ optionsProp } isLoading={ false } />
			);

			expect(
				container.querySelector( '[aria-busy="true"]' )
			).toBeFalsy();
		} );
	} );
} );
