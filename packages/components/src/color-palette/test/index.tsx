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

		expect( screen.getAllByRole( 'option' ) ).toHaveLength( 3 );
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

		await user.click( screen.getByRole( 'option', { selected: true } ) );

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
				selected: false,
			} )[ 0 ]
		);

		// Expect the green color to have been selected
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith(
			EXAMPLE_COLORS[ 1 ].color,
			1,
			undefined
		);
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

	it( 'should render nothing when custom colors are disabled, there are no colors, and it is not clearable', () => {
		const onChange = jest.fn();
		const { container } = render(
			<ColorPalette
				colors={ [] }
				disableCustomColors
				clearable={ false }
				onChange={ onChange }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
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

	it( 'should still show the clear button when colors is empty and custom colors are disabled', () => {
		const onChange = jest.fn();

		render(
			<ColorPalette
				colors={ [] }
				disableCustomColors
				onChange={ onChange }
			/>
		);

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
				name: /^Custom color picker$/,
			} )
		).toBeInTheDocument();
	} );

	describe( 'duplicate colors in palette', () => {
		const DUPLICATE_COLOR_PALETTE = [
			{ name: 'Dark Background', slug: 'dark-background', color: '#000' },
			{ name: 'Dark Text', slug: 'dark-text', color: '#000' },
		];

		it( 'should render all swatches even when two entries share the same color value', () => {
			render(
				<ColorPalette
					colors={ DUPLICATE_COLOR_PALETTE }
					value={ undefined }
					onChange={ jest.fn() }
				/>
			);

			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 2 );
		} );

		it( 'should select by slug when selectedSlug is provided, marking only the matching entry', () => {
			render(
				<ColorPalette
					colors={ DUPLICATE_COLOR_PALETTE }
					value="#000"
					selectedSlug="dark-text"
					onChange={ jest.fn() }
				/>
			);

			const options = screen.getAllByRole( 'option' );
			// "dark-background" is index 0, "dark-text" is index 1.
			// With selectedSlug="dark-text", only the second swatch should be selected.
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'false' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );

		it( 'should fall back to color-value selection and mark all matching duplicates when no selectedSlug is provided', () => {
			render(
				<ColorPalette
					colors={ DUPLICATE_COLOR_PALETTE }
					value="#000"
					onChange={ jest.fn() }
				/>
			);

			const options = screen.getAllByRole( 'option' );
			// Both entries share the same color value, so both appear selected
			// when no slug-specific selection is provided.
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );

		it( 'should treat an empty-string selectedSlug as no slug and fall back to color-value selection', () => {
			render(
				<ColorPalette
					colors={ DUPLICATE_COLOR_PALETTE }
					value="#000"
					selectedSlug=""
					onChange={ jest.fn() }
				/>
			);

			const options = screen.getAllByRole( 'option' );
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );

		it( 'should display the slug-matched entry name in the custom color button label', () => {
			render(
				<ColorPalette
					colors={ DUPLICATE_COLOR_PALETTE }
					value="#000"
					selectedSlug="dark-text"
					onChange={ jest.fn() }
				/>
			);

			expect(
				screen.getByRole( 'button', {
					name: 'Custom color picker. The currently selected color is called "Dark Text" and has a value of "#000".',
				} )
			).toBeInTheDocument();
		} );

		it( 'should pass slug as third argument to onChange when a swatch is clicked', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render(
				<ColorPalette
					colors={ DUPLICATE_COLOR_PALETTE }
					value={ undefined }
					onChange={ onChange }
				/>
			);

			const options = screen.getAllByRole( 'option' );
			await user.click( options[ 1 ] );
			// Second entry: color=#000, index=1, slug='dark-text'
			expect( onChange ).toHaveBeenCalledWith( '#000', 1, 'dark-text' );
		} );

		it( 'should clear the selection when the selected swatch is clicked', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render(
				<ColorPalette
					colors={ DUPLICATE_COLOR_PALETTE }
					value="#000"
					selectedSlug="dark-background"
					onChange={ onChange }
				/>
			);

			// Click the selected swatch — should call onChange with undefined.
			await user.click(
				screen.getByRole( 'option', { selected: true } )
			);
			expect( onChange ).toHaveBeenCalledWith( undefined );
		} );

		it( 'should handle mixed palettes with some entries having slugs and others not', () => {
			const MIXED_PALETTE = [
				{ name: 'Brand White', slug: 'brand-white', color: '#fff' },
				{ name: 'Plain White', color: '#fff' },
				{ name: 'Brand Black', slug: 'brand-black', color: '#000' },
			];

			render(
				<ColorPalette
					colors={ MIXED_PALETTE }
					value="#fff"
					selectedSlug="brand-white"
					onChange={ jest.fn() }
				/>
			);

			const options = screen.getAllByRole( 'option' );
			// Only the entry with slug="brand-white" should be selected.
			// The unslugged "Plain White" entry should NOT be selected, even though
			// its color matches the value prop.
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'false' );
			expect( options[ 2 ] ).toHaveAttribute( 'aria-selected', 'false' );
		} );
	} );
} );
