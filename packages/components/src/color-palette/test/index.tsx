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
import { colorEditingKey } from '../private-keys';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

const withColorEditing = ( config: Record< string, unknown > ) => ( {
	[ colorEditingKey ]: config,
} );

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

	describe( 'color editing', () => {
		const fullCustomEditing = ( overrides = {} ) => ( {
			capabilities: { custom: 'full' as const },
			...overrides,
		} );

		const MULTI_PALETTE = [
			{
				name: 'Theme',
				slug: 'theme',
				colors: [ { name: 'Brand', slug: 'brand', color: '#0073aa' } ],
			},
			{
				name: 'Custom',
				slug: 'custom',
				colors: [
					{
						name: 'Color 1',
						slug: 'custom-color-1',
						color: '#111111',
					},
					{
						name: 'Color 2',
						slug: 'custom-color-2',
						color: '#222222',
					},
				],
			},
		];

		it( 'is opt-in: no `+` swatch or edit/delete buttons when `colorEditing` is absent', () => {
			render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#111111"
					selectedSlug="custom-color-1"
					onChange={ jest.fn() }
				/>
			);

			expect(
				screen.queryByRole( 'option', { name: /Add custom color/ } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: /Edit color/,
				} )
			).not.toBeInTheDocument();
		} );

		it( 'renders a `+` swatch at the end of the custom palette swatches', () => {
			render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#111111"
					selectedSlug="custom-color-1"
					onChange={ jest.fn() }
					{ ...withColorEditing( fullCustomEditing() ) }
				/>
			);

			expect(
				screen.getByRole( 'option', { name: /Add custom color/ } )
			).toBeInTheDocument();
		} );

		it( 'renders an empty custom palette section when management is enabled and no custom colors exist', () => {
			render(
				<ColorPalette
					colors={ [
						{
							name: 'Theme',
							slug: 'theme',
							colors: [
								{
									name: 'Brand',
									slug: 'brand',
									color: '#0073aa',
								},
							],
						},
					] }
					value="#0073aa"
					selectedSlug="brand"
					onChange={ jest.fn() }
					{ ...withColorEditing( fullCustomEditing() ) }
				/>
			);

			expect(
				screen.getByRole( 'heading', { name: 'Custom' } )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'option', { name: 'Add custom color' } )
			).toBeInTheDocument();
		} );

		it( 'opens the add form when no color is selected', async () => {
			const user = userEvent.setup();
			render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					onChange={ jest.fn() }
					{ ...withColorEditing( fullCustomEditing() ) }
				/>
			);

			await user.click(
				screen.getByRole( 'option', { name: 'Add custom color' } )
			);

			expect( screen.getByLabelText( 'Color name' ) ).toHaveValue( '' );
		} );

		it( 'shows edit/delete buttons only for palettes with the matching capability', () => {
			const { rerender } = render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#0073aa"
					selectedSlug="brand"
					onChange={ jest.fn() }
					{ ...withColorEditing( fullCustomEditing() ) }
				/>
			);

			// Selected is a theme color → no management buttons.
			expect(
				screen.queryByRole( 'button', {
					name: /Edit color/,
				} )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: /Delete custom color/,
				} )
			).not.toBeInTheDocument();

			rerender(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#111111"
					selectedSlug="custom-color-1"
					onChange={ jest.fn() }
					{ ...withColorEditing( fullCustomEditing() ) }
				/>
			);

			expect(
				screen.getByRole( 'button', {
					name: 'Edit color: Color 1',
				} )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', {
					name: 'Delete custom color: Color 1',
				} )
			).toBeInTheDocument();
		} );

		it( 'cancels the edit form with the Escape key', async () => {
			const user = userEvent.setup();
			const onUpdateCustomColor = jest.fn();
			render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#111111"
					selectedSlug="custom-color-1"
					onChange={ jest.fn() }
					{ ...withColorEditing(
						fullCustomEditing( {
							onUpdate: onUpdateCustomColor,
						} )
					) }
				/>
			);

			await user.click(
				screen.getByRole( 'button', {
					name: 'Edit color: Color 1',
				} )
			);

			expect( screen.getByLabelText( 'Color name' ) ).toBeInTheDocument();

			await user.keyboard( '{Escape}' );

			expect(
				screen.queryByLabelText( 'Color name' )
			).not.toBeInTheDocument();
			expect( onUpdateCustomColor ).not.toHaveBeenCalled();
		} );

		it( 'asks for confirmation before deleting', async () => {
			const user = userEvent.setup();
			const onDeleteCustomColor = jest.fn();
			const onChange = jest.fn();
			render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#111111"
					selectedSlug="custom-color-1"
					onChange={ onChange }
					{ ...withColorEditing(
						fullCustomEditing( {
							onDelete: onDeleteCustomColor,
						} )
					) }
				/>
			);

			await user.click(
				screen.getByRole( 'button', {
					name: 'Delete custom color: Color 1',
				} )
			);

			expect(
				screen.getByText( 'Delete "Color 1"?' )
			).toBeInTheDocument();

			await user.click(
				screen.getByRole( 'button', { name: 'Delete' } )
			);

			expect( onDeleteCustomColor ).toHaveBeenCalledWith( {
				paletteSlug: 'custom',
				slug: 'custom-color-1',
			} );
			// The selection is cleared after deletion.
			expect( onChange ).toHaveBeenCalledWith( undefined );
		} );

		it( 'shows an add-to-custom button for dirty values and routes it into the add form', async () => {
			const user = userEvent.setup();
			const onAddCustomColor = jest.fn();
			const onChange = jest.fn();
			render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#ff00aa"
					onChange={ onChange }
					{ ...withColorEditing(
						fullCustomEditing( {
							onAdd: onAddCustomColor,
						} )
					) }
				/>
			);

			expect(
				screen.getByText( 'Custom', {
					selector: '.components-color-palette__custom-color-name',
				} )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', { name: 'Add to custom' } )
			).toBeInTheDocument();
			expect(
				screen.queryByText( 'Save as custom color?' )
			).not.toBeInTheDocument();

			await user.click(
				screen.getByRole( 'button', { name: 'Add to custom' } )
			);

			const nameInput = screen.getByLabelText( 'Color name' );
			expect( nameInput ).toHaveValue( '' );
			expect( nameInput ).toHaveAttribute( 'placeholder', 'Color name' );

			const addButton = screen.getByRole( 'button', { name: 'Add' } );
			expect( addButton ).not.toHaveAttribute( 'aria-disabled', 'true' );

			await user.click( addButton );
			expect( onAddCustomColor ).toHaveBeenCalledWith( {
				paletteSlug: 'custom',
				name: '#ff00aa',
				nextSlug: 'custom-ff-00-aa',
				color: '#ff00aa',
			} );
			expect( onChange ).toHaveBeenCalledWith(
				'#ff00aa',
				undefined,
				'custom-ff-00-aa'
			);
		} );

		it( 'uses a typed name when submitting the add form from a dirty value', async () => {
			const user = userEvent.setup();
			const onAddCustomColor = jest.fn();
			const onChange = jest.fn();
			render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#ff00aa"
					onChange={ onChange }
					{ ...withColorEditing(
						fullCustomEditing( {
							onAdd: onAddCustomColor,
						} )
					) }
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Add to custom' } )
			);

			const nameInput = screen.getByLabelText( 'Color name' );
			await user.type( nameInput, 'Hot Pink' );
			await user.click( screen.getByRole( 'button', { name: 'Add' } ) );

			expect( onAddCustomColor ).toHaveBeenCalledWith( {
				paletteSlug: 'custom',
				name: 'Hot Pink',
				nextSlug: 'custom-hot-pink',
				color: '#ff00aa',
			} );
			expect( onChange ).toHaveBeenCalledWith(
				'#ff00aa',
				undefined,
				'custom-hot-pink'
			);
		} );

		it( 'does not show add-to-custom when the active color matches a saved swatch', () => {
			render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#111111"
					selectedSlug="custom-color-1"
					onChange={ jest.fn() }
					{ ...withColorEditing( fullCustomEditing() ) }
				/>
			);

			expect(
				screen.queryByRole( 'button', { name: 'Add to custom' } )
			).not.toBeInTheDocument();
		} );

		it( 'keeps the edit form open and updates local preview visuals during drag', async () => {
			const user = userEvent.setup();
			const onUpdateCustomColor = jest.fn();
			const onPreview = jest.fn();
			render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#111111"
					selectedSlug="custom-color-1"
					onChange={ jest.fn() }
					{ ...withColorEditing(
						fullCustomEditing( {
							onUpdate: onUpdateCustomColor,
							onPreview,
						} )
					) }
				/>
			);

			await user.click(
				screen.getByRole( 'button', {
					name: 'Edit color: Color 1',
				} )
			);

			expect( screen.getByLabelText( 'Color name' ) ).toHaveValue(
				'Color 1'
			);

			await user.click(
				screen.getByRole( 'button', {
					name: /^Custom color picker/,
				} )
			);
			const hexInput = screen.getByLabelText( 'Hex color' );
			await user.clear( hexInput );
			await user.paste( '333333' );

			// Edit form stays open; preview is local even though `value` is
			// unchanged.
			expect( screen.getByLabelText( 'Color name' ) ).toHaveValue(
				'Color 1'
			);
			expect( onPreview ).toHaveBeenCalledWith(
				expect.objectContaining( {
					paletteSlug: 'custom',
					slug: 'custom-color-1',
					color: '#333333',
				} )
			);
			expect(
				await screen.findByText( '#333333', {
					selector: '.components-color-palette__custom-color-value',
				} )
			).toBeInTheDocument();
			expect(
				screen.queryByText( 'Save as custom color?' )
			).not.toBeInTheDocument();

			const saveButton = screen.getByRole( 'button', { name: 'Save' } );
			expect( saveButton ).not.toHaveAttribute( 'aria-disabled' );
			await user.click( saveButton );

			expect( onUpdateCustomColor ).toHaveBeenCalledWith( {
				paletteSlug: 'custom',
				slug: 'custom-color-1',
				nextSlug: 'custom-color-1',
				name: 'Color 1',
				color: '#333333',
			} );
			expect( onPreview ).toHaveBeenLastCalledWith( null );
		} );

		it( 'routes native picker changes to onPreview while editing a custom color', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			const onPreviewCustomColor = jest.fn();
			render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#111111"
					selectedSlug="custom-color-1"
					onChange={ onChange }
					{ ...withColorEditing(
						fullCustomEditing( {
							onUpdate: jest.fn(),
							onPreview: onPreviewCustomColor,
						} )
					) }
				/>
			);

			await user.click(
				screen.getByRole( 'button', {
					name: 'Edit color: Color 1',
				} )
			);

			// Open the native picker and pick a new hex value.
			await user.click(
				screen.getByRole( 'button', {
					name: /^Custom color picker/,
				} )
			);
			const hexInput = screen.getByLabelText( 'Hex color' );
			await user.clear( hexInput );
			await user.paste( '00ff00' );

			expect( onPreviewCustomColor ).toHaveBeenCalledWith(
				expect.objectContaining( {
					paletteSlug: 'custom',
					slug: 'custom-color-1',
					color: '#00ff00',
				} )
			);
			// The consumer's selected value is left untouched: the change is
			// previewed on the palette entry instead.
			expect( onChange ).not.toHaveBeenCalled();
		} );

		it( 'shows pencil but not trash for theme colors with value capability', () => {
			render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#0073aa"
					selectedSlug="brand"
					onChange={ jest.fn() }
					{ ...withColorEditing( {
						capabilities: { theme: 'value' },
						onUpdate: jest.fn(),
					} ) }
				/>
			);

			expect(
				screen.getByRole( 'button', { name: 'Edit color: Brand' } )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: /Delete custom color/,
				} )
			).not.toBeInTheDocument();
		} );

		it( 'renders the name as static text when editing a value-capability palette color', async () => {
			const user = userEvent.setup();
			const onUpdate = jest.fn();
			const onChange = jest.fn();
			render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#0073aa"
					selectedSlug="brand"
					onChange={ onChange }
					{ ...withColorEditing( {
						capabilities: { theme: 'value' },
						onUpdate,
					} ) }
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Edit color: Brand' } )
			);

			expect(
				screen.queryByLabelText( 'Color name' )
			).not.toBeInTheDocument();
			expect(
				screen.getByText( 'Brand', {
					selector: '.components-color-palette__custom-color-name',
				} )
			).toBeInTheDocument();

			await user.click(
				screen.getByRole( 'button', {
					name: /^Custom color picker/,
				} )
			);
			const hexInput = screen.getByLabelText( 'Hex color' );
			await user.clear( hexInput );
			await user.paste( '005177' );

			const saveButton = screen.getByRole( 'button', { name: 'Save' } );
			expect( saveButton ).not.toHaveAttribute( 'aria-disabled' );
			await user.click( saveButton );

			expect( onUpdate ).toHaveBeenCalledWith( {
				paletteSlug: 'theme',
				slug: 'brand',
				nextSlug: 'brand',
				name: 'Brand',
				color: '#005177',
			} );
		} );

		it( 'shows no editing affordances for palettes absent from capabilities', () => {
			const DEFAULT_PALETTE = [
				{
					name: 'Default',
					slug: 'default',
					colors: [
						{
							name: 'Black',
							slug: 'black',
							color: '#000000',
						},
					],
				},
			];

			render(
				<ColorPalette
					colors={ DEFAULT_PALETTE }
					value="#000000"
					selectedSlug="black"
					onChange={ jest.fn() }
					{ ...withColorEditing( {
						capabilities: { custom: 'full' },
						onAdd: jest.fn(),
					} ) }
				/>
			);

			expect(
				screen.queryByRole( 'button', { name: /Edit color/ } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: /Delete custom color/,
				} )
			).not.toBeInTheDocument();
		} );

		it( 'hides add swatch and add-to-custom when custom full capability is absent', () => {
			render(
				<ColorPalette
					colors={ MULTI_PALETTE }
					value="#ff00aa"
					onChange={ jest.fn() }
					{ ...withColorEditing( {
						capabilities: { theme: 'value' },
						onUpdate: jest.fn(),
					} ) }
				/>
			);

			expect(
				screen.queryByRole( 'option', { name: /Add custom color/ } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'Add to custom' } )
			).not.toBeInTheDocument();
		} );
	} );
} );
