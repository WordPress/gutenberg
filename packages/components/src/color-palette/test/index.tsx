/**
 * External dependencies
 */
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import ColorPalette from '..';

const EXAMPLE_COLORS = [
	{ name: 'red', color: '#f00' },
	{ name: 'green', color: '#0f0' },
	{ name: 'blue', color: '#00f' },
];
const INITIAL_COLOR = EXAMPLE_COLORS[ 0 ].color;

const CSS_VARIABLE_COLORS = [
	{ name: 'red', color: 'var(--red)' },
	{ name: 'blue', color: 'var(--blue)' },
];

const CSS_VARS_STYLE_PROPS = {
	'--red': '#f00',
	'--blue': '#00f',
} as React.CSSProperties;

function getWrappingPopoverElement( element: HTMLElement ) {
	return element.closest( '.components-popover' );
}

describe( 'ColorPalette', () => {
	it( 'should render a dynamic toolbar of colors', () => {
		const onChange = jest.fn();

		const { container } = render(
			<ColorPalette
				colors={ EXAMPLE_COLORS }
				value={ INITIAL_COLOR }
				onChange={ onChange }
			/>
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render three color button options', () => {
		const onChange = jest.fn();

		render(
			<ColorPalette
				colors={ EXAMPLE_COLORS }
				value={ INITIAL_COLOR }
				onChange={ onChange }
			/>
		);

		expect(
			screen.getAllByRole( 'button', { name: /^Color:/ } )
		).toHaveLength( 3 );
	} );

	it( 'should call onClick on an active button with undefined', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<ColorPalette
				colors={ EXAMPLE_COLORS }
				value={ INITIAL_COLOR }
				onChange={ onChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: /^Color:/, pressed: true } )
		);

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( undefined );
	} );

	it( 'should call onClick on an inactive button', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<ColorPalette
				colors={ EXAMPLE_COLORS }
				value={ INITIAL_COLOR }
				onChange={ onChange }
			/>
		);

		// Click the first unpressed button
		// (i.e. a button representing a color that is not the current color)
		await user.click(
			screen.getAllByRole( 'button', {
				name: /^Color:/,
				pressed: false,
			} )[ 0 ]
		);

		// Expect the green color to have been selected
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( EXAMPLE_COLORS[ 1 ].color, 1 );
	} );

	it( 'should call onClick with undefined, when the clearButton onClick is triggered', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<ColorPalette
				colors={ EXAMPLE_COLORS }
				value={ INITIAL_COLOR }
				onChange={ onChange }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Clear' } ) );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( undefined );
	} );

	it( 'should allow disabling custom color picker', () => {
		const onChange = jest.fn();

		const { container } = render(
			<ColorPalette
				colors={ EXAMPLE_COLORS }
				disableCustomColors
				value={ INITIAL_COLOR }
				onChange={ onChange }
			/>
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render dropdown and its content', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<ColorPalette
				colors={ EXAMPLE_COLORS }
				value={ INITIAL_COLOR }
				onChange={ onChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', {
				name: /^Custom color picker/,
				expanded: false,
			} )
		);

		const dropdownButton = screen.getByRole( 'button', {
			name: /^Custom color picker/,
			expanded: true,
		} );

		expect( dropdownButton ).toBeVisible();

		expect(
			within( dropdownButton ).getByText( EXAMPLE_COLORS[ 0 ].name )
		).toBeVisible();

		expect(
			within( dropdownButton ).getByText(
				EXAMPLE_COLORS[ 0 ].color.replace( '#', '' )
			)
		).toBeVisible();

		// Check that the popover with custom color input has appeared.
		const dropdownColorInput = screen.getByLabelText( 'Hex color' );

		await waitFor( () =>
			expect(
				getWrappingPopoverElement( dropdownColorInput )
			).toBePositionedPopover()
		);
	} );

	it( 'should show the clear button by default', () => {
		const onChange = jest.fn();

		render(
			<ColorPalette
				colors={ EXAMPLE_COLORS }
				value={ INITIAL_COLOR }
				onChange={ onChange }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Clear' } )
		).toBeInTheDocument();
	} );

	it( 'should show the clear button even when `colors` is an empty array', () => {
		const onChange = jest.fn();

		render( <ColorPalette colors={ [] } onChange={ onChange } /> );

		expect(
			screen.getByRole( 'button', { name: 'Clear' } )
		).toBeInTheDocument();
	} );

	it( 'should show the readable text label even when the background color has a CSS variable.', async () => {
		// const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<div style={ CSS_VARS_STYLE_PROPS }>
				<ColorPalette
					colors={ CSS_VARIABLE_COLORS }
					value={ CSS_VARIABLE_COLORS[ 0 ].color }
					onChange={ onChange }
				/>
			</div>
		);

		const dropdownButton = screen.getByRole( 'button', {
			name: /^Custom color picker/,
			expanded: false,
		} );

		const dropdownButtonStyles = window.getComputedStyle( dropdownButton );
		expect( dropdownButtonStyles.color ).toBe( 'rgb(0, 0, 0)' );
	} );

	it( 'should render dropdown with Hex value transformed from CSS a variable to actual color', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<div style={ CSS_VARS_STYLE_PROPS }>
				<ColorPalette
					colors={ CSS_VARIABLE_COLORS }
					value={ CSS_VARIABLE_COLORS[ 0 ].color }
					onChange={ onChange }
				/>
			</div>
		);

		const dropdownButton = screen.getByRole( 'button', {
			name: /^Custom color picker/,
			expanded: false,
		} );

		await user.click( dropdownButton );

		const dropdownColorInput = screen.getByLabelText( 'Hex color' );
		expect( dropdownColorInput ).toHaveValue( 'FF0000' );
	} );
} );
