/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import FontSizePicker from '../';

const getUnitSelect = () =>
	document.body.querySelector( '.components-unit-control select' );
const getUnitLabel = () =>
	document.body.querySelector( '.components-unit-control__unit-label' );

describe( 'FontSizePicker', () => {
	describe( 'onChange values', () => {
		it( 'should not use units when the initial value is a number', () => {
			let fontSize = 12;
			const setFontSize = jest.fn(
				( nextSize ) => ( fontSize = nextSize )
			);

			render(
				<FontSizePicker value={ fontSize } onChange={ setFontSize } />
			);

			const unitSelect = getUnitSelect();
			const unitLabel = getUnitLabel();
			const input = screen.getByLabelText( 'Custom', {
				selector: 'input',
			} );

			input.focus();
			fireEvent.change( input, { target: { value: 16 } } );

			expect( unitSelect ).toBeFalsy();
			expect( unitLabel ).toBeTruthy();
			expect( fontSize ).toBe( 16 );
		} );

		it( 'should use units when the initial value has a unit', () => {
			let fontSize = '12px';
			const setFontSize = jest.fn(
				( nextSize ) => ( fontSize = nextSize )
			);

			render(
				<FontSizePicker value={ fontSize } onChange={ setFontSize } />
			);

			const unitSelect = getUnitSelect();
			const unitLabel = getUnitLabel();
			const input = screen.getByLabelText( 'Custom', {
				selector: 'input',
			} );

			input.focus();
			fireEvent.change( input, { target: { value: 16 } } );

			expect( unitSelect ).toBeTruthy();
			expect( unitLabel ).toBeFalsy();
			expect( fontSize ).toBe( '16px' );
		} );

		it( 'should not use units when fontSizes size values are numbers', () => {
			let fontSize;
			const fontSizes = [
				{
					name: 'Small',
					slug: 'small',
					size: 12,
				},
			];
			const setFontSize = jest.fn(
				( nextSize ) => ( fontSize = nextSize )
			);

			render(
				<FontSizePicker
					fontSizes={ fontSizes }
					value={ fontSize }
					onChange={ setFontSize }
				/>
			);

			const unitSelect = getUnitSelect();
			const unitLabel = getUnitLabel();
			const input = screen.getByLabelText( 'Custom', {
				selector: 'input',
			} );

			input.focus();
			fireEvent.change( input, { target: { value: 16 } } );

			expect( unitSelect ).toBeFalsy();
			expect( unitLabel ).toBeTruthy();
			expect( fontSize ).toBe( 16 );
		} );

		it( 'should use units when fontSizes size values have units', () => {
			let fontSize;
			const fontSizes = [
				{
					name: 'Small',
					slug: 'small',
					size: '12px',
				},
			];
			const setFontSize = jest.fn(
				( nextSize ) => ( fontSize = nextSize )
			);

			render(
				<FontSizePicker
					fontSizes={ fontSizes }
					value={ fontSize }
					onChange={ setFontSize }
				/>
			);

			const unitSelect = getUnitSelect();
			const unitLabel = getUnitLabel();
			const input = screen.getByLabelText( 'Custom', {
				selector: 'input',
			} );

			input.focus();
			fireEvent.change( input, { target: { value: 16 } } );

			expect( unitSelect ).toBeTruthy();
			expect( unitLabel ).toBeFalsy();
			expect( fontSize ).toBe( '16px' );
		} );
	} );
} );
