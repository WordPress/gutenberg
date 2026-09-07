import { fireEvent, screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { click } from '@ariakit/test';
import { useState } from '@wordpress/element';
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

// Without the controlled component, slider values don't update after changes.
// Controlled component with state helps synchronize input box and slider during testing.
const ControlledColorPicker = ( {
	onChange: onChangeProp,
	initialColor = '#000000',
	...restProps
}: React.ComponentProps< typeof ColorPicker > & { initialColor?: string } ) => {
	const [ colorState, setColorState ] = useState( initialColor );

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

			expect( onChangeComplete ).toHaveBeenCalledTimes( 4 );
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

			expect( onChange ).toHaveBeenCalledTimes( 4 );
			expect( onChange ).toHaveBeenLastCalledWith( '#11aabb' );
		} );

		it( 'should reset color to black when the hex input is completely cleared', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			const color = '#11aabb';

			render(
				<ColorPicker
					onChange={ onChange }
					color={ color }
					enableAlpha={ false }
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			await user.selectOptions( formatSelector, 'hex' );

			const hexInput = screen.getByRole( 'textbox' );
			await user.clear( hexInput );

			expect( onChange ).toHaveBeenLastCalledWith( '#000000' );
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
			// It should also cause the `onChange` callback to fire. The hue and
			// saturation should be preserved (not reset to 0) since the user
			// explicitly set them earlier.
			fireEvent.change( lightnessSlider, { target: { value: 100 } } );

			await waitFor( () =>
				expect( lightnessSlider ).toHaveValue( '100' )
			);
			expect( lightnessNumberInput ).toHaveValue( 100 );
			expect( hueSlider ).toHaveValue( '80' );
			expect( saturationSlider ).toHaveValue( '50' );
			expect( hueNumberInput ).toHaveValue( 80 );
			expect( saturationNumberInput ).toHaveValue( 50 );
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

		it( 'should preserve hue and saturation when lightness is set to 0 (black)', async () => {
			const onChange = jest.fn();

			render(
				<ControlledColorPicker
					onChange={ onChange }
					enableAlpha={ false }
					initialColor="#2ad5d5" // hsl(180, 67%, 50%)
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			await userEvent.setup().selectOptions( formatSelector, 'hsl' );

			const hueSliders = screen.getAllByRole( 'slider', { name: 'Hue' } );
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

			// Verify initial values
			expect( hueSlider ).toHaveValue( '180' );
			expect( saturationSlider ).toHaveValue( '67' );

			// Set lightness to 0 (black)
			fireEvent.change( lightnessSlider, { target: { value: 0 } } );

			await waitFor( () => expect( lightnessSlider ).toHaveValue( '0' ) );

			// Hue and saturation should be preserved
			expect( hueSlider ).toHaveValue( '180' );
			expect( saturationSlider ).toHaveValue( '67' );
			expect( hueNumberInput ).toHaveValue( 180 );
			expect( saturationNumberInput ).toHaveValue( 67 );
			expect( onChange ).toHaveBeenLastCalledWith( '#000000' );
		} );

		it.each( [
			[ 'black', 0 ],
			[ 'white', 100 ],
		] )(
			'should allow saturation 50→0 at %s without firing onChange',
			async ( _label, lightness ) => {
				const onChange = jest.fn();

				render(
					<ControlledColorPicker
						onChange={ onChange }
						enableAlpha={ false }
						initialColor="#000000"
					/>
				);

				const formatSelector = screen.getByRole( 'combobox' );
				await userEvent.setup().selectOptions( formatSelector, 'hsl' );

				const hueSlider = screen
					.getAllByRole( 'slider', { name: 'Hue' } )
					.at( -1 )!;
				const saturationSlider = screen.getByRole( 'slider', {
					name: 'Saturation',
				} );
				const lightnessSlider = screen.getByRole( 'slider', {
					name: 'Lightness',
				} );
				const saturationNumberInput = screen.getByRole( 'spinbutton', {
					name: 'Saturation',
				} );

				// Build hsl(200, 50%, lightness%) via HSL controls.
				fireEvent.change( hueSlider, { target: { value: 200 } } );
				fireEvent.change( saturationSlider, { target: { value: 50 } } );
				fireEvent.change( lightnessSlider, {
					target: { value: lightness },
				} );
				await waitFor( () =>
					expect( lightnessSlider ).toHaveValue( String( lightness ) )
				);

				expect( saturationSlider ).toHaveValue( '50' );
				expect( saturationNumberInput ).toHaveValue( 50 );
				onChange.mockClear();

				fireEvent.change( saturationSlider, { target: { value: 0 } } );

				expect( saturationSlider ).toHaveValue( '0' );
				expect( saturationNumberInput ).toHaveValue( 0 );
				expect( onChange ).not.toHaveBeenCalled();
			}
		);

		it( 'should fire onChange once per real color change in controlled mode', async () => {
			const onChange = jest.fn();

			render(
				<ControlledColorPicker
					onChange={ onChange }
					enableAlpha={ false }
					initialColor="#2ad5d5" // hsl(180, 67%, 50%)
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			await userEvent.setup().selectOptions( formatSelector, 'hsl' );

			const lightnessSlider = screen.getByRole( 'slider', {
				name: 'Lightness',
			} );

			fireEvent.change( lightnessSlider, { target: { value: 40 } } );
			await waitFor( () =>
				expect( lightnessSlider ).toHaveValue( '40' )
			);
			expect( onChange ).toHaveBeenCalledTimes( 1 );

			fireEvent.change( lightnessSlider, { target: { value: 30 } } );
			await waitFor( () =>
				expect( lightnessSlider ).toHaveValue( '30' )
			);
			expect( onChange ).toHaveBeenCalledTimes( 2 );

			fireEvent.change( lightnessSlider, { target: { value: 0 } } );
			await waitFor( () => expect( lightnessSlider ).toHaveValue( '0' ) );
			expect( onChange ).toHaveBeenCalledTimes( 3 );
			onChange.mockClear();

			const hueSlider = screen
				.getAllByRole( 'slider', { name: 'Hue' } )
				.at( -1 )!;
			fireEvent.change( hueSlider, { target: { value: 90 } } );
			expect( onChange ).not.toHaveBeenCalled();
		} );

		it( 'should reset saturation to 0 when a mid-gray is entered via hex input', async () => {
			const user = userEvent.setup();

			render(
				<ControlledColorPicker
					enableAlpha={ false }
					initialColor="#2ad5d5" // hsl(180, 67%, 50%)
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );

			// Start in hex mode and enter a mid-gray.
			await user.selectOptions( formatSelector, 'hex' );
			const hexInput = screen.getByRole( 'textbox' );
			await user.clear( hexInput );
			await user.type( hexInput, '808080' );

			// Switch to HSL to inspect the values.
			await user.selectOptions( formatSelector, 'hsl' );

			const saturationSlider = screen.getByRole( 'slider', {
				name: 'Saturation',
			} );
			const saturationNumberInput = screen.getByRole( 'spinbutton', {
				name: 'Saturation',
			} );

			// #808080 is hsl(0, 0%, 50%) — a pure mid-gray.
			// Saturation must be 0, not the stale value from the
			// previous chromatic color.
			await waitFor( () =>
				expect( saturationSlider ).toHaveValue( '0' )
			);
			expect( saturationNumberInput ).toHaveValue( 0 );
		} );

		it( 'should preserve hue when saturation is set to 0', async () => {
			const onChange = jest.fn();

			render(
				<ControlledColorPicker
					onChange={ onChange }
					enableAlpha={ false }
					initialColor="#ff0000" // hsl(0, 100%, 50%) - pure red
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			await userEvent.setup().selectOptions( formatSelector, 'hsl' );

			const hueSliders = screen.getAllByRole( 'slider', { name: 'Hue' } );
			const hueSlider = hueSliders.at( -1 )!;
			const saturationSlider = screen.getByRole( 'slider', {
				name: 'Saturation',
			} );
			const hueNumberInput = screen.getByRole( 'spinbutton', {
				name: 'Hue',
			} );

			// Set a specific hue first
			fireEvent.change( hueSlider, { target: { value: 200 } } );

			await waitFor( () => expect( hueSlider ).toHaveValue( '200' ) );

			// Set saturation to 0 (grayscale)
			fireEvent.change( saturationSlider, { target: { value: 0 } } );

			await waitFor( () =>
				expect( saturationSlider ).toHaveValue( '0' )
			);

			// Hue should be preserved even though color is now gray
			expect( hueSlider ).toHaveValue( '200' );
			expect( hueNumberInput ).toHaveValue( 200 );

			// Increase saturation again - hue should still be 200
			fireEvent.change( saturationSlider, { target: { value: 50 } } );

			await waitFor( () =>
				expect( saturationSlider ).toHaveValue( '50' )
			);

			expect( hueSlider ).toHaveValue( '200' );
			expect( hueNumberInput ).toHaveValue( 200 );
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

	describe( 'visual picker', () => {
		const mockInteractiveBounds = ( interactive: HTMLElement ) => {
			interactive.getBoundingClientRect = () =>
				( {
					left: 0,
					top: 0,
					width: 100,
					height: 100,
					right: 100,
					bottom: 100,
					x: 0,
					y: 0,
					toJSON: () => ( {} ),
				} ) as DOMRect;
		};

		it( 'preserves saturation when keyboard-navigating to black in controlled mode', () => {
			const onChange = jest.fn();

			// Saturated red with mid brightness — HSVA s stays high at black.
			const { container } = render(
				<ControlledColorPicker
					onChange={ onChange }
					enableAlpha={ false }
					initialColor="#cc0000"
				/>
			);

			const colorSlider = screen.getByRole( 'slider', { name: 'Color' } );
			// Pointer is a presentational sibling; no accessible role.
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const pointer = container.querySelector(
				'.react-colorful__saturation-pointer'
			) as HTMLElement;
			expect( pointer ).toBeTruthy();

			const leftBefore = pointer.style.left;
			expect( parseFloat( leftBefore ) ).toBeGreaterThan( 50 );

			// react-colorful reads which/keyCode (37–40), not event.key.
			// From v≈80, 5% steps need at least 16 ArrowDown presses to reach black.
			colorSlider.focus();
			for ( let i = 0; i < 20; i++ ) {
				fireEvent.keyDown( colorSlider, {
					key: 'ArrowDown',
					keyCode: 40,
					which: 40,
				} );
			}

			expect( pointer ).toHaveStyle( { top: '100%', left: leftBefore } );
			expect( onChange ).toHaveBeenLastCalledWith( '#000000' );
		} );

		it( 'preserves saturation when pointer selects black in controlled mode', () => {
			const onChange = jest.fn();

			const { container } = render(
				<ControlledColorPicker
					onChange={ onChange }
					enableAlpha={ false }
					initialColor="#cc0000"
				/>
			);

			const interactive = screen.getByRole( 'slider', { name: 'Color' } );
			mockInteractiveBounds( interactive );

			// Pointer is a presentational sibling; no accessible role.
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const pointer = container.querySelector(
				'.react-colorful__saturation-pointer'
			) as HTMLElement;
			expect( parseFloat( pointer.style.left ) ).toBeGreaterThan( 50 );

			// Click the bottom of the saturation surface (v = 0) at ~80% saturation.
			fireEvent.mouseDown( interactive, {
				buttons: 1,
				pageX: 80,
				pageY: 100,
				clientX: 80,
				clientY: 100,
			} );

			expect( pointer ).toHaveStyle( { top: '100%' } );
			// Lossy HSVA→HSLA→HSVA sync would snap left to 0%.
			expect( pointer ).not.toHaveStyle( { left: '0%' } );
			expect( parseFloat( pointer.style.left ) ).toBeGreaterThan( 50 );
			expect( onChange ).toHaveBeenLastCalledWith( '#000000' );
		} );

		it( 'preserves saturation after a full pointer drag to black then HSL hue edit', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const { container } = render(
				<ControlledColorPicker
					onChange={ onChange }
					enableAlpha={ false }
					initialColor="#cc0000"
				/>
			);

			const interactive = screen.getByRole( 'slider', { name: 'Color' } );
			mockInteractiveBounds( interactive );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const pointer = container.querySelector(
				'.react-colorful__saturation-pointer'
			) as HTMLElement;

			// Full pointer lifecycle so isPointerInteractingRef is exercised
			// and prevHslaRef stays in sync across mid-gesture parent updates.
			fireEvent.pointerDown( interactive, {
				pointerId: 1,
				buttons: 1,
				pageX: 80,
				pageY: 50,
				clientX: 80,
				clientY: 50,
			} );
			fireEvent.mouseDown( interactive, {
				buttons: 1,
				pageX: 80,
				pageY: 50,
				clientX: 80,
				clientY: 50,
			} );
			fireEvent.mouseMove( interactive, {
				buttons: 1,
				pageX: 80,
				pageY: 100,
				clientX: 80,
				clientY: 100,
			} );
			fireEvent.pointerUp( interactive, {
				pointerId: 1,
				buttons: 0,
				pageX: 80,
				pageY: 100,
				clientX: 80,
				clientY: 100,
			} );
			fireEvent.mouseUp( interactive, {
				buttons: 0,
				pageX: 80,
				pageY: 100,
				clientX: 80,
				clientY: 100,
			} );

			expect( pointer ).toHaveStyle( { top: '100%' } );
			expect( parseFloat( pointer.style.left ) ).toBeGreaterThan( 50 );
			expect( onChange ).toHaveBeenLastCalledWith( '#000000' );
			const leftAfterDrag = pointer.style.left;

			const formatSelector = screen.getByRole( 'combobox' );
			await user.selectOptions( formatSelector, 'hsl' );

			const hueSlider = screen
				.getAllByRole( 'slider', { name: 'Hue' } )
				.at( -1 )!;
			fireEvent.change( hueSlider, { target: { value: 200 } } );
			await waitFor( () => expect( hueSlider ).toHaveValue( '200' ) );

			// Stale prevHslaRef would mistake the hue edit for a saturation
			// change and snap the pointer to left: 0%.
			expect( pointer ).toHaveStyle( {
				top: '100%',
				left: leftAfterDrag,
			} );
		} );

		it( 'places the pointer at s:0 when HSL lightness is set to white', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const { container } = render(
				<ControlledColorPicker
					onChange={ onChange }
					enableAlpha={ false }
					initialColor="#cc0000"
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			await user.selectOptions( formatSelector, 'hsl' );

			const lightnessSlider = screen.getByRole( 'slider', {
				name: 'Lightness',
			} );
			fireEvent.change( lightnessSlider, { target: { value: 100 } } );
			await waitFor( () =>
				expect( lightnessSlider ).toHaveValue( '100' )
			);
			expect( onChange ).toHaveBeenLastCalledWith( '#ffffff' );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const pointer = container.querySelector(
				'.react-colorful__saturation-pointer'
			) as HTMLElement;
			// Only v:100,s:0 is white; a preserved chromatic s leaves the
			// pointer at top-right and makes the next key step jump to red.
			expect( pointer ).toHaveStyle( { top: '0%', left: '0%' } );

			const colorSlider = screen.getByRole( 'slider', { name: 'Color' } );
			colorSlider.focus();
			fireEvent.keyDown( colorSlider, {
				key: 'ArrowDown',
				keyCode: 40,
				which: 40,
			} );

			expect( onChange ).not.toHaveBeenLastCalledWith( '#f50000' );
			expect( onChange ).not.toHaveBeenLastCalledWith( '#cc0000' );
		} );

		it( 'preserves visual saturation when HSL hue is edited at black', async () => {
			const user = userEvent.setup();

			const { container } = render(
				<ControlledColorPicker
					enableAlpha={ false }
					initialColor="#cc0000"
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			await user.selectOptions( formatSelector, 'hsl' );

			const lightnessSlider = screen.getByRole( 'slider', {
				name: 'Lightness',
			} );
			fireEvent.change( lightnessSlider, { target: { value: 0 } } );
			await waitFor( () => expect( lightnessSlider ).toHaveValue( '0' ) );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const pointer = container.querySelector(
				'.react-colorful__saturation-pointer'
			) as HTMLElement;
			const leftBefore = pointer.style.left;
			expect( parseFloat( leftBefore ) ).toBeGreaterThan( 50 );
			expect( pointer ).toHaveStyle( { top: '100%' } );

			const hueSlider = screen
				.getAllByRole( 'slider', { name: 'Hue' } )
				.at( -1 )!;
			fireEvent.change( hueSlider, { target: { value: 200 } } );
			await waitFor( () => expect( hueSlider ).toHaveValue( '200' ) );

			expect( pointer ).toHaveStyle( {
				top: '100%',
				left: leftBefore,
			} );
		} );

		it( 'keeps the white visual coordinate at s:0 when HSL hue is edited', async () => {
			const user = userEvent.setup();

			const { container } = render(
				<ControlledColorPicker
					enableAlpha={ false }
					initialColor="#cc0000"
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			await user.selectOptions( formatSelector, 'hsl' );

			const lightnessSlider = screen.getByRole( 'slider', {
				name: 'Lightness',
			} );
			fireEvent.change( lightnessSlider, { target: { value: 100 } } );
			await waitFor( () =>
				expect( lightnessSlider ).toHaveValue( '100' )
			);

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const pointer = container.querySelector(
				'.react-colorful__saturation-pointer'
			) as HTMLElement;
			expect( pointer ).toHaveStyle( { top: '0%', left: '0%' } );

			const hueSlider = screen
				.getAllByRole( 'slider', { name: 'Hue' } )
				.at( -1 )!;
			fireEvent.change( hueSlider, { target: { value: 200 } } );
			await waitFor( () => expect( hueSlider ).toHaveValue( '200' ) );

			expect( pointer ).toHaveStyle( { top: '0%', left: '0%' } );
		} );

		it( 'uses the HSL hue when leaving white through the visual surface', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render(
				<ControlledColorPicker
					onChange={ onChange }
					enableAlpha={ false }
					initialColor="#cc0000"
				/>
			);

			await user.selectOptions( screen.getByRole( 'combobox' ), 'hsl' );
			const lightnessSlider = screen.getByRole( 'slider', {
				name: 'Lightness',
			} );
			fireEvent.change( lightnessSlider, { target: { value: 100 } } );

			const hueSlider = screen
				.getAllByRole( 'slider', { name: 'Hue' } )
				.at( -1 )!;
			fireEvent.change( hueSlider, { target: { value: 200 } } );
			await waitFor( () => expect( hueSlider ).toHaveValue( '200' ) );

			const colorSlider = screen.getByRole( 'slider', { name: 'Color' } );
			mockInteractiveBounds( colorSlider );
			onChange.mockClear();
			fireEvent.mouseDown( colorSlider, {
				buttons: 1,
				pageX: 50,
				pageY: 0,
				clientX: 50,
				clientY: 0,
			} );

			expect( onChange ).toHaveBeenLastCalledWith( '#80d4ff' );
		} );

		it( 'uses the HSL hue when leaving a mid-gray through the visual surface', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render(
				<ControlledColorPicker
					onChange={ onChange }
					enableAlpha={ false }
					initialColor="#808080"
				/>
			);

			await user.selectOptions( screen.getByRole( 'combobox' ), 'hsl' );
			const hueSlider = screen
				.getAllByRole( 'slider', { name: 'Hue' } )
				.at( -1 )!;
			fireEvent.change( hueSlider, { target: { value: 200 } } );
			await waitFor( () => expect( hueSlider ).toHaveValue( '200' ) );

			const colorSlider = screen.getByRole( 'slider', { name: 'Color' } );
			mockInteractiveBounds( colorSlider );
			onChange.mockClear();
			fireEvent.mouseDown( colorSlider, {
				buttons: 1,
				pageX: 50,
				pageY: 50,
				clientX: 50,
				clientY: 50,
			} );

			expect( onChange ).toHaveBeenLastCalledWith( '#416c81' );
		} );

		it( 'updates visual saturation when HSL saturation is edited at black', async () => {
			const user = userEvent.setup();

			const { container } = render(
				<ControlledColorPicker
					enableAlpha={ false }
					initialColor="#cc0000"
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			await user.selectOptions( formatSelector, 'hsl' );

			const lightnessSlider = screen.getByRole( 'slider', {
				name: 'Lightness',
			} );
			fireEvent.change( lightnessSlider, { target: { value: 0 } } );
			await waitFor( () => expect( lightnessSlider ).toHaveValue( '0' ) );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const pointer = container.querySelector(
				'.react-colorful__saturation-pointer'
			) as HTMLElement;
			expect( pointer ).toHaveStyle( { top: '100%' } );
			expect( parseFloat( pointer.style.left ) ).toBeGreaterThan( 50 );

			const saturationSlider = screen.getByRole( 'slider', {
				name: 'Saturation',
			} );
			fireEvent.change( saturationSlider, {
				target: { value: 25 },
			} );
			await waitFor( () =>
				expect( saturationSlider ).toHaveValue( '25' )
			);

			expect( pointer ).toHaveStyle( {
				top: '100%',
				left: '25%',
			} );
		} );
	} );

	describe.each( [
		[ 'hsl', 'HSL' ],
		[ 'rgb', 'RGB' ],
	] )( 'Alpha-enabled %s format', ( format, formatLabel ) => {
		it( `should update alpha correctly when ${ formatLabel } format is selected`, async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render(
				<ControlledColorPicker
					onChange={ onChange }
					enableAlpha
					initialColor="#ffffff80"
				/>
			);

			const formatSelector = screen.getByRole( 'combobox' );
			expect( formatSelector ).toBeVisible();
			await user.selectOptions( formatSelector, format );

			const alphaInput = screen.getByRole( 'spinbutton', {
				name: 'Alpha',
			} );
			expect( alphaInput ).toBeVisible();

			const alphaSliders = screen.getAllByRole( 'slider', {
				name: 'Alpha',
			} );

			expect( alphaSliders ).toHaveLength( 2 );

			// Choose the second slider which is the actual slider of type: input[type="range"]
			const alphaSlider = alphaSliders.at( -1 )!;

			expect( alphaSlider ).toHaveValue( '50' );
			expect( alphaInput ).toHaveValue( 50 );

			expect( onChange ).not.toHaveBeenCalled();

			// Test pattern 1: Update the slider
			fireEvent.change( alphaSlider, {
				target: { value: 75 },
			} );

			await waitFor( () => {
				expect( onChange ).toHaveBeenCalledTimes( 1 );
			} );

			expect( onChange ).toHaveBeenLastCalledWith( '#ffffffbf' );
			expect( alphaInput ).toHaveValue( 75 );
			expect( alphaSlider ).toHaveValue( '75' );

			onChange.mockClear();

			// Test pattern 2: Update the alphaInput
			await user.clear( alphaInput );
			expect( onChange ).toHaveBeenCalledTimes( 1 );

			// Initially type 7 in the alpha input, we expect it to be called with #ffffff12
			await user.keyboard( '7' );

			// Now with 75% opacity we expect it to be called with #ffffffbf
			await user.keyboard( '5' );

			// Called twice, once per key stroke (`7` and `5`)
			expect( onChange ).toHaveBeenCalledTimes( 3 );
			expect( onChange ).toHaveBeenNthCalledWith( 2, '#ffffff12' );
			expect( onChange ).toHaveBeenNthCalledWith( 3, '#ffffffbf' );

			expect( alphaSlider ).toHaveValue( '75' );
			expect( alphaInput ).toHaveValue( 75 );
		} );
	} );
} );
