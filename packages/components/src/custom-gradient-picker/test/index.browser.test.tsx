import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
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

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const bar = container.querySelector(
				'.components-custom-gradient-picker__gradient-bar'
			) as HTMLElement;
			const barBounds = bar.getBoundingClientRect();
			expect( barBounds.width ).toBeGreaterThan( 0 );
			// Hover mid-bar so the insert-point control appears (away from 0%/100%).
			fireEvent.mouseMove( bar, {
				clientX: barBounds.left + barBounds.width / 2,
			} );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const insertButton = container.querySelector(
				'.components-custom-gradient-picker__insert-point-dropdown'
			) as HTMLElement;
			expect( insertButton ).toBeTruthy();
			fireEvent.click( insertButton );

			const colorSlider = screen.getByRole( 'slider', { name: 'Color' } );
			const sliderBounds = colorSlider.getBoundingClientRect();
			expect( sliderBounds.width ).toBeGreaterThan( 0 );
			expect( sliderBounds.height ).toBeGreaterThan( 0 );

			// Choose a saturated mid-brightness color — creates the new stop and
			// exercises parent gradient updates while picking.
			const clientX = sliderBounds.left + sliderBounds.width * 0.8;
			const clientY = sliderBounds.top + sliderBounds.height * 0.2;
			fireEvent.mouseDown( colorSlider, {
				buttons: 1,
				clientX,
				clientY,
				pageX: clientX + window.scrollX,
				pageY: clientY + window.scrollY,
			} );

			// ColorPicker content is portaled; pointer has no accessible role.
			// eslint-disable-next-line testing-library/no-node-access
			const pointer = document.querySelector(
				'.react-colorful__saturation-pointer'
			) as HTMLElement;
			expect( pointer ).toBeTruthy();
			const surface = pointer.offsetParent as HTMLElement;
			const leftBefore =
				( pointer.offsetLeft / surface.clientWidth ) * 100;
			expect( leftBefore ).toBeGreaterThan( 50 );

			// Keyboard to black — must not reset saturation via HSVA↔HSLA echo
			// while the gradient parent keeps updating (#80110 / #80205).
			colorSlider.focus();
			for ( let i = 0; i < 20; i++ ) {
				fireEvent.keyDown( colorSlider, {
					key: 'ArrowDown',
					keyCode: 40,
					which: 40,
				} );
			}

			expect(
				( pointer.offsetTop / surface.clientHeight ) * 100
			).toBeCloseTo( 100 );
			expect(
				( pointer.offsetLeft / surface.clientWidth ) * 100
			).toBeCloseTo( leftBefore );

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
			const onChange = vi.fn();

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
			const onChange = vi.fn();

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
			const onChange = vi.fn();

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
