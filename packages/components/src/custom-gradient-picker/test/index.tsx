/**
 * External dependencies
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CustomGradientPicker from '../';

function ControlledCustomGradientPicker( {
	initialValue = 'linear-gradient(90deg,rgb(0,0,0) 0%,rgb(255,255,255) 100%)',
}: {
	initialValue?: string;
} ) {
	const [ value, setValue ] = useState( initialValue );
	return <CustomGradientPicker value={ value } onChange={ setValue } />;
}

describe( 'CustomGradientPicker', () => {
	describe( 'new gradient stop color picker', () => {
		it( 'preserves visual saturation when setting a new stop color through black', async () => {
			const { container } = render( <ControlledCustomGradientPicker /> );

			const markers = container.querySelector(
				'.components-custom-gradient-picker__markers-container'
			) as HTMLElement;
			markers.getBoundingClientRect = () =>
				( {
					left: 0,
					x: 0,
					width: 200,
					top: 0,
					height: 20,
					right: 200,
					bottom: 20,
					y: 0,
					toJSON: () => ( {} ),
				} ) as DOMRect;

			const bar = container.querySelector(
				'.components-custom-gradient-picker__gradient-bar'
			) as HTMLElement;
			// Hover mid-bar so the insert-point control appears (away from 0%/100%).
			fireEvent.mouseMove( bar, { clientX: 100 } );

			const insertButton = container.querySelector(
				'.components-custom-gradient-picker__insert-point-dropdown'
			) as HTMLElement;
			expect( insertButton ).toBeTruthy();
			fireEvent.click( insertButton );

			const colorSlider = screen.getByRole( 'slider', { name: 'Color' } );
			colorSlider.getBoundingClientRect = () =>
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

			fireEvent.mouseDown( colorSlider, {
				buttons: 1,
				pageX: 80,
				pageY: 20,
				clientX: 80,
				clientY: 20,
			} );

			const pointer = document.querySelector(
				'.react-colorful__saturation-pointer'
			) as HTMLElement;
			expect( pointer ).toBeTruthy();
			const leftBefore = pointer.style.left;
			expect( parseFloat( leftBefore ) ).toBeGreaterThan( 50 );

			// Keyboard to black — must not reset saturation via HSVA↔HSLA echo
			colorSlider.focus();
			for ( let i = 0; i < 20; i++ ) {
				fireEvent.keyDown( colorSlider, {
					key: 'ArrowDown',
					keyCode: 40,
					which: 40,
				} );
			}

			expect( pointer ).toHaveStyle( {
				top: '100%',
				left: leftBefore,
			} );

			// Close the portaled popover so later tests are not affected by
			// asynchronous Popover position updates.
			fireEvent.click( insertButton );
			await waitFor( () => {
				expect(
					screen.queryByRole( 'slider', { name: 'Color' } )
				).not.toBeInTheDocument();
			} );
		} );
	} );

	describe( 'GradientTypePicker angle persistence', () => {
		it( 'should restore the previous linear angle when switching from radial back to linear', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render(
				<CustomGradientPicker
					value="linear-gradient(125deg,rgb(0,0,0) 0%,rgb(255,255,255) 100%)"
					onChange={ onChange }
				/>
			);

			const typeSelect = screen.getByRole( 'combobox', {
				name: /type/i,
			} );
			await user.selectOptions( typeSelect, 'radial-gradient' );
			await user.selectOptions( typeSelect, 'linear-gradient' );

			// Verify the angle from before the radial switch is restored, not the default
			const lastCall =
				onChange.mock.calls[ onChange.mock.calls.length - 1 ][ 0 ];
			expect( lastCall ).toContain( '125deg' );
		} );

		it( 'should use HORIZONTAL_GRADIENT_ORIENTATION when no prior linear angle exists', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			// Start with a radial gradient so there is no previous linear angle in the ref
			render(
				<CustomGradientPicker
					value="radial-gradient(rgb(0,0,0) 0%, rgb(255,255,255) 100%)"
					onChange={ onChange }
				/>
			);

			const typeSelect = screen.getByRole( 'combobox', {
				name: /type/i,
			} );
			await user.selectOptions( typeSelect, 'linear-gradient' );

			const lastCall =
				onChange.mock.calls[ onChange.mock.calls.length - 1 ][ 0 ];
			expect( lastCall ).toContain( '90deg' );
		} );

		it( 'should not restore angle when switching to radial', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render(
				<CustomGradientPicker
					value="linear-gradient(45deg, rgb(0,0,0) 0%, rgb(255,255,255) 100%)"
					onChange={ onChange }
				/>
			);

			const typeSelect = screen.getByRole( 'combobox', {
				name: /type/i,
			} );
			await user.selectOptions( typeSelect, 'radial-gradient' );

			// Radial gradients have no orientation, so deg should not appear in the output
			const lastCall =
				onChange.mock.calls[ onChange.mock.calls.length - 1 ][ 0 ];
			expect( lastCall ).not.toContain( 'deg' );
		} );
	} );
} );
