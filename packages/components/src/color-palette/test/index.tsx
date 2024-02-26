/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
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

const ControlledColorPalette = ( {
	onChange,
}: {
	onChange?: ( newColor?: string ) => void;
} ) => {
	const [ color, setColor ] = useState< string | undefined >( undefined );

	return (
		<ColorPalette
			value={ color }
			colors={ EXAMPLE_COLORS }
			onChange={ ( newColor ) => {
				setColor( newColor );
				onChange?.( newColor );
			} }
		/>
	);
};

describe( 'ColorPalette', () => {
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
			screen.getAllByRole( 'option', { name: /^Color:/ } )
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
			screen.getByRole( 'option', { name: /^Color:/, selected: true } )
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
			screen.getAllByRole( 'option', {
				name: /^Color:/,
				selected: false,
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

	it( 'should render custom color picker', () => {
		const onChange = jest.fn();

		render(
			<ColorPalette
				colors={ EXAMPLE_COLORS }
				value={ INITIAL_COLOR }
				onChange={ onChange }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: /^Custom color picker\./ } )
		).toBeInTheDocument();
	} );

	it( 'should allow disabling custom color picker', () => {
		const onChange = jest.fn();

		render(
			<ColorPalette
				colors={ EXAMPLE_COLORS }
				disableCustomColors
				value={ INITIAL_COLOR }
				onChange={ onChange }
			/>
		);

		expect(
			screen.queryByRole( 'button', { name: /^Custom color picker\./ } )
		).not.toBeInTheDocument();
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

		// Check that custom color popover is not visible by default.
		expect(
			screen.queryByLabelText( 'Hex color' )
		).not.toBeInTheDocument();

		// Click the dropdown button while the dropdown is not expanded.
		await user.click(
			screen.getByRole( 'button', {
				name: /^Custom color picker/,
				expanded: false,
			} )
		);

		// Confirm the dropdown is now expanded, and the button is still visible.
		const dropdownButton = screen.getByRole( 'button', {
			name: /^Custom color picker/,
			expanded: true,
		} );
		expect( dropdownButton ).toBeVisible();

		// Check that the popover with custom color input has appeared.
		const dropdownColorInput = screen.getByLabelText( 'Hex color' );

		await waitFor( () =>
			expect( dropdownColorInput ).toBePositionedPopover()
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

	it( 'should display the selected color name and value', async () => {
		const user = userEvent.setup();

		render( <ControlledColorPalette /> );

		const { name: colorName, color: colorCode } = EXAMPLE_COLORS[ 0 ];

		expect( screen.getByText( 'No color selected' ) ).toBeVisible();

		// Click the first unpressed button
		await user.click(
			screen.getAllByRole( 'option', {
				name: /^Color:/,
				selected: false,
			} )[ 0 ]
		);

		// Confirm the correct color name, color value, and button label are used
		expect(
			screen.getByText( colorName, {
				selector: '.components-color-palette__custom-color-name',
			} )
		).toBeVisible();
		expect(
			screen.getByText( colorCode, {
				selector: '.components-color-palette__custom-color-value',
			} )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', {
				name: `Custom color picker. The currently selected color is called "${ colorName }" and has a value of "${ colorCode }".`,
				expanded: false,
			} )
		).toBeInTheDocument();

		// Clear the color, confirm that the relative values are cleared/updated.
		await user.click( screen.getByRole( 'button', { name: 'Clear' } ) );
		expect( screen.getByText( 'No color selected' ) ).toBeVisible();
		expect(
			screen.queryByText( colorName, {
				selector: '.components-color-palette__custom-color-name',
			} )
		).not.toBeInTheDocument();
		expect( screen.queryByText( colorCode ) ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', {
				name: /^Custom color picker.$/,
			} )
		).toBeInTheDocument();
	} );
} );
