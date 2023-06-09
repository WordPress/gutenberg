/**
 * External dependencies
 */
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { ColorPicker } from '..';

const hslaMatcher = expect.objectContaining( {
	h: expect.any( Number ),
	s: expect.any( Number ),
	l: expect.any( Number ),
	a: expect.any( Number ),
} );

const legacyColorMatcher = {
	hex: expect.any( String ),
	hsl: hslaMatcher,
	hsv: expect.objectContaining( {
		h: expect.any( Number ),
		s: expect.any( Number ),
		v: expect.any( Number ),
		a: expect.any( Number ),
	} ),
	rgb: expect.objectContaining( {
		r: expect.any( Number ),
		g: expect.any( Number ),
		b: expect.any( Number ),
		a: expect.any( Number ),
	} ),
	oldHue: expect.any( Number ),
	source: 'hex',
};

describe( 'ColorPicker', () => {
	describe( 'legacy props', () => {
		it( 'should fire onChangeComplete with the legacy color format', async () => {
			const user = userEvent.setup();
			const onChangeComplete = jest.fn();
			const color = '#000';

			render(
				<ColorPicker
					onChangeComplete={ onChangeComplete }
					color={ color }
					enableAlpha={ false }
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			expect( formatSelector ).toBeVisible();

			await user.selectOptions( formatSelector, 'hex' );

			const hexInput = screen.getByRole( 'textbox' );
			expect( hexInput ).toBeVisible();

			await user.clear( hexInput );
			await user.type( hexInput, '1ab' );

			expect( onChangeComplete ).toHaveBeenCalledTimes( 3 );
			expect( onChangeComplete ).toHaveBeenLastCalledWith(
				legacyColorMatcher
			);
		} );
	} );
	describe( 'Hex input', () => {
		it( 'should fire onChange with the correct value from the hex input', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			const color = '#000';

			render(
				<ColorPicker
					onChange={ onChange }
					color={ color }
					enableAlpha={ false }
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			expect( formatSelector ).toBeVisible();

			await user.selectOptions( formatSelector, 'hex' );

			const hexInput = screen.getByRole( 'textbox' );
			expect( hexInput ).toBeVisible();

			await user.clear( hexInput );
			await user.type( hexInput, '1ab' );

			expect( onChange ).toHaveBeenCalledTimes( 3 );
			expect( onChange ).toHaveBeenLastCalledWith( '#11aabb' );
		} );
	} );

	describe.each( [
		[ 'red', 'Red', '#7dffff' ],
		[ 'green', 'Green', '#ff7dff' ],
		[ 'blue', 'Blue', '#ffff7d' ],
	] )( 'RGB inputs', ( colorInput, inputLabel, expected ) => {
		it( `should fire onChange with the correct value when the ${ colorInput } value is updated`, async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			const color = '#fff';

			render(
				<ColorPicker
					onChange={ onChange }
					color={ color }
					enableAlpha={ false }
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			expect( formatSelector ).toBeVisible();

			await user.selectOptions( formatSelector, 'rgb' );

			const inputElement = screen.getByRole( 'spinbutton', {
				name: inputLabel,
			} );
			expect( inputElement ).toBeVisible();

			await user.clear( inputElement );
			await user.type( inputElement, '125' );

			expect( onChange ).toHaveBeenCalledTimes( 4 );
			expect( onChange ).toHaveBeenLastCalledWith( expected );
		} );
	} );

	describe.each( [
		[ 'hue', 'Hue', '#aad52a' ],
		[ 'saturation', 'Saturation', '#20dfdf' ],
		[ 'lightness', 'Lightness', '#95eaea' ],
	] )( 'HSL inputs', ( colorInput, inputLabel, expected ) => {
		it( `should fire onChange with the correct value when the ${ colorInput } value is updated`, async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			const color = '#2ad5d5';

			render(
				<ColorPicker
					onChange={ onChange }
					color={ color }
					enableAlpha={ false }
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			expect( formatSelector ).toBeVisible();

			await user.selectOptions( formatSelector, 'hsl' );

			const inputElement = screen.getByRole( 'spinbutton', {
				name: inputLabel,
			} );
			expect( inputElement ).toBeVisible();

			await user.clear( inputElement );
			await user.type( inputElement, '75' );

			expect( onChange ).toHaveBeenCalledTimes( 3 );
			expect( onChange ).toHaveBeenLastCalledWith( expected );
		} );
	} );
} );
