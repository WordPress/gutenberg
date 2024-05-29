/**
 * External dependencies
 */
import { fireEvent, screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ColorPicker } from '..';
import { click } from '@ariakit/test';

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

	describe( 'HSL inputs', () => {
		it( 'sliders should use accurate H and S values based on user interaction when possible', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const ControlledColorPicker = ( {
				onChange: onChangeProp,
				...restProps
			}: React.ComponentProps< typeof ColorPicker > ) => {
				const [ colorState, setColorState ] = useState( '#000000' );

				const internalOnChange: typeof onChangeProp = ( newColor ) => {
					onChangeProp?.( newColor );
					setColorState( newColor );
				};

				return (
					<>
						<ColorPicker
							{ ...restProps }
							onChange={ internalOnChange }
							color={ colorState }
						/>
						<button onClick={ () => setColorState( '#4d87ba' ) }>
							Set color to #4d87ba
						</button>
					</>
				);
			};

			render(
				<ControlledColorPicker
					onChange={ onChange }
					enableAlpha={ false }
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			expect( formatSelector ).toBeVisible();

			await user.selectOptions( formatSelector, 'hsl' );

			const hueSliders = screen.getAllByRole( 'slider', {
				name: 'Hue',
			} );
			expect( hueSliders ).toHaveLength( 2 );

			// Reason for the `!` post-fix expression operator: if the check above
			// doesn't fail, we're guaranteed that `hueSlider` is not undefined.
			const hueSlider = hueSliders.at( -1 )!;
			const saturationSlider = screen.getByRole( 'slider', {
				name: 'Saturation',
			} );
			const lightnessSlider = screen.getByRole( 'slider', {
				name: 'Lightness',
			} );
			const hueNumberInput = screen.getByRole( 'spinbutton', {
				name: 'Hue',
			} );
			const saturationNumberInput = screen.getByRole( 'spinbutton', {
				name: 'Saturation',
			} );
			const lightnessNumberInput = screen.getByRole( 'spinbutton', {
				name: 'Lightness',
			} );

			// All initial inputs should have a value of `0` since the color is black.
			expect( hueSlider ).toHaveValue( '0' );
			expect( saturationSlider ).toHaveValue( '0' );
			expect( lightnessSlider ).toHaveValue( '0' );
			expect( hueNumberInput ).toHaveValue( 0 );
			expect( saturationNumberInput ).toHaveValue( 0 );
			expect( lightnessNumberInput ).toHaveValue( 0 );

			// Interact with the Hue slider, it should change its value (and the
			// value of the associated number input), but it shouldn't cause the
			// `onChange` callback to fire, since the resulting color is still black.
			fireEvent.change( hueSlider, { target: { value: 80 } } );

			expect( hueSlider ).toHaveValue( '80' );
			expect( hueNumberInput ).toHaveValue( 80 );
			expect( onChange ).not.toHaveBeenCalled();

			// Interact with the Saturation slider, it should change its value (and the
			// value of the associated number input), but it shouldn't cause the
			// `onChange` callback to fire, since the resulting color is still black.
			fireEvent.change( saturationSlider, { target: { value: 50 } } );

			expect( saturationSlider ).toHaveValue( '50' );
			expect( saturationNumberInput ).toHaveValue( 50 );
			expect( onChange ).not.toHaveBeenCalled();

			// Interact with the Lightness slider, it should change its value (and the
			// value of the associated number input). It should also cause the
			// `onChange` callback to fire, since changing the lightness actually
			// causes the color to change.
			fireEvent.change( lightnessSlider, { target: { value: 30 } } );

			await waitFor( () =>
				expect( lightnessSlider ).toHaveValue( '30' )
			);
			expect( lightnessNumberInput ).toHaveValue( 30 );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenLastCalledWith( '#597326' );

			// Interact with the Lightness slider, setting to 100 (ie. white).
			// It should also cause the `onChange` callback to fire, and reset the
			// hue and saturation inputs to `0`.
			fireEvent.change( lightnessSlider, { target: { value: 100 } } );

			await waitFor( () =>
				expect( lightnessSlider ).toHaveValue( '100' )
			);
			expect( lightnessNumberInput ).toHaveValue( 100 );
			expect( hueSlider ).toHaveValue( '0' );
			expect( saturationSlider ).toHaveValue( '0' );
			expect( hueNumberInput ).toHaveValue( 0 );
			expect( saturationNumberInput ).toHaveValue( 0 );
			expect( onChange ).toHaveBeenCalledTimes( 2 );
			expect( onChange ).toHaveBeenLastCalledWith( '#ffffff' );

			// Interact with the Hue slider, it should change its value (and the
			// value of the associated number input), but it shouldn't cause the
			// `onChange` callback to fire, since the resulting color is still white.
			fireEvent.change( hueSlider, { target: { value: 147 } } );

			expect( hueSlider ).toHaveValue( '147' );
			expect( hueNumberInput ).toHaveValue( 147 );
			expect( onChange ).toHaveBeenCalledTimes( 2 );

			// Interact with the Saturation slider, it should change its value (and the
			// value of the associated number input), but it shouldn't cause the
			// `onChange` callback to fire, since the resulting color is still white.
			fireEvent.change( saturationSlider, { target: { value: 82 } } );

			expect( saturationSlider ).toHaveValue( '82' );
			expect( saturationNumberInput ).toHaveValue( 82 );
			expect( onChange ).toHaveBeenCalledTimes( 2 );

			// Interact with the Lightness slider, it should change its value (and the
			// value of the associated number input). It should also cause the
			// `onChange` callback to fire, since changing the lightness actually
			// causes the color to change.
			fireEvent.change( lightnessSlider, { target: { value: 14 } } );

			await waitFor( () =>
				expect( lightnessSlider ).toHaveValue( '14' )
			);
			expect( lightnessNumberInput ).toHaveValue( 14 );
			expect( onChange ).toHaveBeenCalledTimes( 3 );
			expect( onChange ).toHaveBeenLastCalledWith( '#064121' );

			// Set the color externally. All inputs should update to match the H/S/L
			// value of the new color.
			const setColorButton = screen.getByRole( 'button', {
				name: /set color/i,
			} );
			await click( setColorButton );

			expect( hueSlider ).toHaveValue( '208' );
			expect( hueNumberInput ).toHaveValue( 208 );
			expect( saturationSlider ).toHaveValue( '44' );
			expect( saturationNumberInput ).toHaveValue( 44 );
			expect( lightnessSlider ).toHaveValue( '52' );
			expect( lightnessNumberInput ).toHaveValue( 52 );
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
} );
