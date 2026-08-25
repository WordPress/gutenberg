import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import { DuotonePicker } from '..';
import type { DuotonePickerProps } from '../types';

const COLORS_A = [ '#000000', '#ffffff' ];
const COLORS_B = [ '#8c00b7', '#fcff41' ];

// Adding two duotones with the `+` button in the Global Styles palette editor
// seeds both from the palette's darkest and lightest colors, so two presets
// holding the same pair is the normal case rather than a contrived one.
const DUPLICATE_DUOTONES = [
	{ name: 'Dark Background', slug: 'dark-background', colors: COLORS_A },
	{ name: 'Dark Text', slug: 'dark-text', colors: COLORS_A },
];

const COLOR_PALETTE = [
	{ color: '#000000', name: 'Black', slug: 'black' },
	{ color: '#ffffff', name: 'White', slug: 'white' },
];

describe( 'DuotonePicker', () => {
	describe( 'duplicate duotones in palette', () => {
		it( 'should render all swatches even when two entries share the same colors', () => {
			render(
				<DuotonePicker
					aria-label="Duotone"
					duotonePalette={ DUPLICATE_DUOTONES }
					colorPalette={ COLOR_PALETTE }
					value={ undefined }
					onChange={ jest.fn() }
					disableCustomDuotone
					disableCustomColors
				/>
			);

			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 3 );
		} );

		it( 'should select by slug when selectedSlug is provided, marking only the matching entry', () => {
			render(
				<DuotonePicker
					aria-label="Duotone"
					duotonePalette={ DUPLICATE_DUOTONES }
					colorPalette={ COLOR_PALETTE }
					value={ COLORS_A }
					selectedSlug="dark-text"
					onChange={ jest.fn() }
					unsetable={ false }
					disableCustomDuotone
					disableCustomColors
				/>
			);

			const options = screen.getAllByRole( 'option' );
			// "dark-background" is index 0, "dark-text" is index 1.
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'false' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );

		it( 'should fall back to value selection and mark all matching duplicates when no selectedSlug is provided', () => {
			render(
				<DuotonePicker
					aria-label="Duotone"
					duotonePalette={ DUPLICATE_DUOTONES }
					colorPalette={ COLOR_PALETTE }
					value={ COLORS_A }
					onChange={ jest.fn() }
					unsetable={ false }
					disableCustomDuotone
					disableCustomColors
				/>
			);

			const options = screen.getAllByRole( 'option' );
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );

		it( 'should treat an empty-string selectedSlug as no slug and fall back to value selection', () => {
			render(
				<DuotonePicker
					aria-label="Duotone"
					duotonePalette={ DUPLICATE_DUOTONES }
					colorPalette={ COLOR_PALETTE }
					value={ COLORS_A }
					selectedSlug=""
					onChange={ jest.fn() }
					unsetable={ false }
					disableCustomDuotone
					disableCustomColors
				/>
			);

			const options = screen.getAllByRole( 'option' );
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );

		it( 'should pass index and slug to onChange when a swatch is clicked', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render(
				<DuotonePicker
					aria-label="Duotone"
					duotonePalette={ DUPLICATE_DUOTONES }
					colorPalette={ COLOR_PALETTE }
					value={ undefined }
					onChange={ onChange }
					unsetable={ false }
					disableCustomDuotone
					disableCustomColors
				/>
			);

			await user.click(
				screen.getByRole( 'option', { name: 'Duotone: Dark Text' } )
			);

			expect( onChange ).toHaveBeenCalledWith( COLORS_A, 1, 'dark-text' );
		} );

		it( 'should clear only the selected preset, identified by slug', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render(
				<DuotonePicker
					aria-label="Duotone"
					duotonePalette={ DUPLICATE_DUOTONES }
					colorPalette={ COLOR_PALETTE }
					value={ COLORS_A }
					selectedSlug="dark-text"
					onChange={ onChange }
					unsetable={ false }
					disableCustomDuotone
					disableCustomColors
				/>
			);

			// The unselected twin must still report its own identity rather
			// than clearing, which is what happens when selection is decided
			// by color alone.
			await user.click(
				screen.getByRole( 'option', {
					name: 'Duotone: Dark Background',
				} )
			);

			expect( onChange ).toHaveBeenCalledWith(
				COLORS_A,
				0,
				'dark-background'
			);
		} );
	} );

	describe( 'controlled usage', () => {
		// Mirrors how a consumer wires the picker up: value and slug both held
		// in state and fed back in.
		function Controlled( {
			duotonePalette,
		}: Pick< DuotonePickerProps, 'duotonePalette' > ) {
			const [ value, setValue ] =
				useState< DuotonePickerProps[ 'value' ] >();
			const [ slug, setSlug ] = useState< string | undefined >();
			return (
				<DuotonePicker
					aria-label="Duotone"
					duotonePalette={ duotonePalette }
					colorPalette={ COLOR_PALETTE }
					value={ value }
					selectedSlug={ slug }
					onChange={ ( newValue, index, newSlug ) => {
						setValue( newValue );
						setSlug( newSlug );
					} }
					unsetable={ false }
					disableCustomDuotone
					disableCustomColors
				/>
			);
		}

		it( 'should clear both the value and the selected state when the selected preset is clicked again', async () => {
			const user = userEvent.setup();
			render( <Controlled duotonePalette={ DUPLICATE_DUOTONES } /> );

			const option = () =>
				screen.getByRole( 'option', { name: 'Duotone: Dark Text' } );

			await user.click( option() );
			expect( option() ).toHaveAttribute( 'aria-selected', 'true' );

			// Clicking it again deselects. If the slug were reported back on
			// deselection, the swatch would stay selected with no value.
			await user.click( option() );
			expect( option() ).toHaveAttribute( 'aria-selected', 'false' );
			expect(
				screen.getByRole( 'option', {
					name: 'Duotone: Dark Background',
				} )
			).toHaveAttribute( 'aria-selected', 'false' );
		} );

		it( 'should move the selection when a different preset is clicked', async () => {
			const user = userEvent.setup();
			render( <Controlled duotonePalette={ DUPLICATE_DUOTONES } /> );

			await user.click(
				screen.getByRole( 'option', { name: 'Duotone: Dark Text' } )
			);
			await user.click(
				screen.getByRole( 'option', {
					name: 'Duotone: Dark Background',
				} )
			);

			expect(
				screen.getByRole( 'option', {
					name: 'Duotone: Dark Background',
				} )
			).toHaveAttribute( 'aria-selected', 'true' );
			expect(
				screen.getByRole( 'option', { name: 'Duotone: Dark Text' } )
			).toHaveAttribute( 'aria-selected', 'false' );
		} );
	} );

	describe( 'distinct duotones', () => {
		it( 'should mark the preset matching value as selected', () => {
			render(
				<DuotonePicker
					aria-label="Duotone"
					duotonePalette={ [
						{ name: 'A', slug: 'a', colors: COLORS_A },
						{ name: 'B', slug: 'b', colors: COLORS_B },
					] }
					colorPalette={ COLOR_PALETTE }
					value={ COLORS_B }
					onChange={ jest.fn() }
					unsetable={ false }
					disableCustomDuotone
					disableCustomColors
				/>
			);

			const options = screen.getAllByRole( 'option' );
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'false' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );
	} );
} );
