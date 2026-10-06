import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useState } from '@wordpress/element';
import '../../button/style.scss';
import '../style.scss';
import '../../dropdown/style.scss';
import '../../popover/style.scss';
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
			const { container } = await render(
				<ControlledCustomGradientPicker />
			);

			// eslint-disable-next-line testing-library/no-node-access
			const bar = container.querySelector(
				'.components-custom-gradient-picker__gradient-bar'
			) as HTMLElement;
			const barBounds = bar.getBoundingClientRect();
			expect( barBounds.width ).toBeGreaterThan( 0 );
			// Hover mid-bar so the insert-point control appears (away from 0%/100%).
			await userEvent.hover( bar, {
				position: { x: barBounds.width / 2, y: barBounds.height / 2 },
			} );

			// eslint-disable-next-line testing-library/no-node-access
			const insertButton = container.querySelector(
				'.components-custom-gradient-picker__insert-point-dropdown'
			) as HTMLElement;
			expect( insertButton ).toBeTruthy();
			await userEvent.click( insertButton );

			const colorSlider = screen.getByRole( 'slider', { name: 'Color' } );
			const sliderBounds = colorSlider.getBoundingClientRect();
			expect( sliderBounds.width ).toBeGreaterThan( 0 );
			expect( sliderBounds.height ).toBeGreaterThan( 0 );

			// Choose a saturated mid-brightness color — creates the new stop and
			// exercises parent gradient updates while picking.
			await userEvent.click( colorSlider, {
				position: {
					x: sliderBounds.width * 0.8,
					y: sliderBounds.height * 0.2,
				},
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
				await userEvent.keyboard( '{ArrowDown}' );
			}

			expect(
				( pointer.offsetTop / surface.clientHeight ) * 100
			).toBeCloseTo( 100 );
			expect(
				( pointer.offsetLeft / surface.clientWidth ) * 100
			).toBeCloseTo( leftBefore );

			// Close the portaled popover so later tests are not affected by
			// asynchronous Popover position updates.
			await userEvent.click( insertButton );
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

			await render(
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
			await render(
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

			await render(
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

	it.each( [ 'top', 'bottom' ] )(
		'adds a control point from the %s of the gradient bar',
		async ( edge ) => {
			const onChange = vi.fn();
			const { container } = await render(
				<CustomGradientBar
					background="linear-gradient(90deg, black, white)"
					hasGradient
					value={ POINTS }
					onChange={ onChange }
				/>
			);
			// eslint-disable-next-line testing-library/no-node-access -- The gradient background has no accessible role.
			const bar = container.querySelector< HTMLElement >(
				'.components-custom-gradient-picker__gradient-bar'
			)!;
			const bounds = bar.getBoundingClientRect();
			const position = {
				x: bounds.width / 2,
				y: edge === 'top' ? 1 : bounds.height - 1,
			};

			await userEvent.hover( bar, { position } );
			// eslint-disable-next-line testing-library/no-node-access -- The inserter has no accessible name.
			const inserter = container.querySelector< HTMLElement >(
				'.components-custom-gradient-picker__insert-point-dropdown'
			)!;
			expect( inserter ).toBeVisible();
			await userEvent.click( bar, { position } );
			expect( inserter ).toHaveAttribute( 'aria-expanded', 'true' );

			await userEvent.click(
				screen.getByRole( 'slider', { name: 'Color' } )
			);
			expect( onChange ).toHaveBeenCalledWith(
				expect.arrayContaining( [
					...POINTS,
					{ position: 50, color: expect.any( String ) },
				] )
			);
			await userEvent.keyboard( '{Escape}' );
		}
	);

	it.each( [ 'top', 'bottom' ] )(
		'opens neighboring control points from the %s of the gradient bar',
		async ( edge ) => {
			const { container } = await render(
				<div style={ { width: 248 } }>
					<CustomGradientBar
						background="linear-gradient(90deg, black 40%, white 50%)"
						hasGradient
						value={ [
							{ ...POINTS[ 0 ], position: 40 },
							{ ...POINTS[ 1 ], position: 50 },
						] }
						onChange={ vi.fn() }
					/>
				</div>
			);
			// eslint-disable-next-line testing-library/no-node-access -- The gradient background has no accessible role.
			const bar = container.querySelector< HTMLElement >(
				'.components-custom-gradient-picker__gradient-bar'
			)!;
			const bounds = bar.getBoundingClientRect();
			const points = screen.getAllByRole( 'button', {
				name: /Gradient control point/,
			} );

			for ( const point of points ) {
				const pointBounds = point.getBoundingClientRect();
				await userEvent.click( bar, {
					position: {
						x: pointBounds.x - bounds.x + pointBounds.width / 2,
						y: edge === 'top' ? 1 : bounds.height - 1,
					},
				} );
				expect( point ).toHaveAttribute( 'aria-expanded', 'true' );
				await userEvent.keyboard( '{Escape}' );
				expect( point ).toHaveAttribute( 'aria-expanded', 'false' );
			}
		}
	);

	// The counterpart to the duotone bar's tests: positioning is on unless a
	// consumer opts out, so arrow keys must still move a control point.
	it( 'moves a control point with the arrow keys', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		await render(
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

	it.each( [
		[ 'top', 0 ],
		[ 'middle', 0.5 ],
		[ 'bottom', 1 ],
	] as const )(
		'moves a control point when dragged from the %s of the gradient bar',
		async ( _edge, verticalPosition ) => {
			const onChange = vi.fn();

			const { container } = await render(
				<CustomGradientBar
					background="linear-gradient(90deg,rgb(0,0,0) 0%,rgb(255,255,255) 100%)"
					hasGradient
					value={ POINTS }
					onChange={ onChange }
				/>
			);

			// eslint-disable-next-line testing-library/no-node-access
			const markers = container.querySelector(
				'.components-custom-gradient-picker__markers-container'
			) as HTMLElement;
			expect( markers.getBoundingClientRect().width ).toBeGreaterThan(
				0
			);
			// eslint-disable-next-line testing-library/no-node-access -- The gradient background has no accessible role.
			const bar = markers.closest< HTMLElement >(
				'.components-custom-gradient-picker__gradient-bar'
			)!;
			const bounds = bar.getBoundingClientRect();

			const [ firstPoint ] = screen.getAllByRole( 'button', {
				name: /Gradient control point/,
			} );

			const pointBounds = firstPoint.getBoundingClientRect();
			await userEvent.dragAndDrop( bar, bar, {
				sourcePosition: {
					x: pointBounds.x - bounds.x + pointBounds.width / 2,
					y: 1 + ( bounds.height - 2 ) * verticalPosition,
				},
				targetPosition: { x: bounds.width / 2, y: bounds.height / 2 },
			} );

			// The midpoint of the rendered container is 50%.
			expect( onChange ).toHaveBeenCalledWith( [
				{ position: 50, color: 'rgb(0,0,0)' },
				POINTS[ 1 ],
			] );
		}
	);

	it( 'does not move a control point when dragged and positioning is disabled', async () => {
		const onChange = vi.fn();

		const { container } = await render(
			<CustomGradientBar
				background="linear-gradient(90deg,rgb(0,0,0) 0%,rgb(255,255,255) 100%)"
				hasGradient
				disablePositioning
				value={ POINTS }
				onChange={ onChange }
			/>
		);

		// eslint-disable-next-line testing-library/no-node-access
		const markers = container.querySelector(
			'.components-custom-gradient-picker__markers-container'
		) as HTMLElement;
		expect( markers.getBoundingClientRect().width ).toBeGreaterThan( 0 );
		// eslint-disable-next-line testing-library/no-node-access -- The gradient background has no accessible role.
		const bar = markers.closest< HTMLElement >(
			'.components-custom-gradient-picker__gradient-bar'
		)!;
		const bounds = bar.getBoundingClientRect();

		const [ firstPoint ] = screen.getAllByRole( 'button', {
			name: /Gradient control point/,
		} );

		await userEvent.dragAndDrop( firstPoint, bar, {
			targetPosition: { x: bounds.width / 2, y: bounds.height / 2 },
		} );

		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'does not move a control point when positioning is disabled', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		await render(
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
