import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import CustomGradientPicker from '../';
import CustomGradientBar from '../gradient-bar';
import { KEYBOARD_CONTROL_POINT_VARIATION } from '../gradient-bar/constants';

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

			// Presentational gradient bar markup; no accessible roles.
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
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

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const bar = container.querySelector(
				'.components-custom-gradient-picker__gradient-bar'
			) as HTMLElement;
			// Hover mid-bar so the insert-point control appears (away from 0%/100%).
			fireEvent.mouseMove( bar, { clientX: 100 } );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
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

			// Choose a saturated mid-brightness color — creates the new stop and
			// exercises parent gradient updates while picking.
			fireEvent.mouseDown( colorSlider, {
				buttons: 1,
				pageX: 80,
				pageY: 20,
				clientX: 80,
				clientY: 20,
			} );

			// ColorPicker content is portaled; pointer has no accessible role.
			// eslint-disable-next-line testing-library/no-node-access
			const pointer = document.querySelector(
				'.react-colorful__saturation-pointer'
			) as HTMLElement;
			expect( pointer ).toBeTruthy();
			const leftBefore = pointer.style.left;
			expect( parseFloat( leftBefore ) ).toBeGreaterThan( 50 );

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

describe( 'CustomGradientBar', () => {
	const POINTS = [
		{ position: 0, color: 'rgb(0,0,0)' },
		{ position: 100, color: 'rgb(255,255,255)' },
	];

	// The counterpart to the duotone bar's tests: positioning is on unless a
	// consumer opts out, so arrow keys must still move a control point.
	it( 'moves a control point with the arrow keys', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<CustomGradientBar
				background="linear-gradient(90deg,rgb(0,0,0) 0%,rgb(255,255,255) 100%)"
				hasGradient
				value={ POINTS }
				onChange={ onChange }
			/>
		);

		const [ firstPoint ] = screen.getAllByRole( 'button', {
			name: /Gradient control point/,
		} );

		// The description still offers positioning and removal, which the
		// duotone bar's shorter one drops.
		expect( firstPoint ).toHaveAccessibleDescription(
			/change the gradient position.+remove the control point/
		);

		firstPoint.focus();
		await user.keyboard( '[ArrowRight]' );

		expect( onChange ).toHaveBeenCalledWith( [
			{ position: KEYBOARD_CONTROL_POINT_VARIATION, color: 'rgb(0,0,0)' },
			POINTS[ 1 ],
		] );
	} );

	// Dragging is driven by window-level listeners attached on mousedown, and
	// the position comes from the markers container's box, so that has to be
	// given one in jsdom.
	it( 'moves a control point when dragged', () => {
		const onChange = jest.fn();

		const { container } = render(
			<CustomGradientBar
				background="linear-gradient(90deg,rgb(0,0,0) 0%,rgb(255,255,255) 100%)"
				hasGradient
				value={ POINTS }
				onChange={ onChange }
			/>
		);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const markers = container.querySelector(
			'.components-custom-gradient-picker__markers-container'
		) as HTMLElement;
		markers.getBoundingClientRect = () =>
			( { x: 0, width: 200 } ) as DOMRect;

		const [ firstPoint ] = screen.getAllByRole( 'button', {
			name: /Gradient control point/,
		} );

		fireEvent.mouseDown( firstPoint );
		fireEvent.mouseMove( window, { clientX: 100 } );
		fireEvent.mouseUp( window );

		// 100px into a 200px container is 50%.
		expect( onChange ).toHaveBeenCalledWith( [
			{ position: 50, color: 'rgb(0,0,0)' },
			POINTS[ 1 ],
		] );
	} );

	it( 'does not move a control point when dragged and positioning is disabled', () => {
		const onChange = jest.fn();

		const { container } = render(
			<CustomGradientBar
				background="linear-gradient(90deg,rgb(0,0,0) 0%,rgb(255,255,255) 100%)"
				hasGradient
				disablePositioning
				value={ POINTS }
				onChange={ onChange }
			/>
		);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const markers = container.querySelector(
			'.components-custom-gradient-picker__markers-container'
		) as HTMLElement;
		markers.getBoundingClientRect = () =>
			( { x: 0, width: 200 } ) as DOMRect;

		const [ firstPoint ] = screen.getAllByRole( 'button', {
			name: /Gradient control point/,
		} );

		fireEvent.mouseDown( firstPoint );
		fireEvent.mouseMove( window, { clientX: 100 } );
		fireEvent.mouseUp( window );

		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'does not move a control point when positioning is disabled', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<CustomGradientBar
				background="linear-gradient(90deg,rgb(0,0,0) 0%,rgb(255,255,255) 100%)"
				hasGradient
				disablePositioning
				value={ POINTS }
				onChange={ onChange }
			/>
		);

		const [ firstPoint ] = screen.getAllByRole( 'button', {
			name: /Gradient control point/,
		} );
		firstPoint.focus();
		await user.keyboard( '[ArrowRight]' );

		expect( onChange ).not.toHaveBeenCalled();
	} );
} );
