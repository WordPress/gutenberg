import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WritingSizeDropdown from '../size-dropdown';

const FONT_SIZES = [
	{ slug: 'small', name: 'Small', size: '13px' },
	{ slug: 'medium', name: 'Medium', size: '20px' },
	{ slug: 'large', name: 'Large', size: '36px' },
];

const FLUID_FONT_SIZES = [
	{ slug: 'small', name: 'Small', size: '13px' },
	{
		slug: 'fluid',
		name: 'Headline',
		size: 'clamp(2rem, 2rem + 2vw, 4rem)',
	},
];

const noop = () => {};

describe( 'WritingSizeDropdown', () => {
	it( 'names each theme size by its number, as a word processor does', async () => {
		const user = userEvent.setup();
		render(
			<WritingSizeDropdown
				fontSizes={ FONT_SIZES }
				onSelectPreset={ noop }
				onSetCustom={ noop }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Size' } ) );

		expect(
			screen
				.getAllByRole( 'menuitemradio' )
				.map( ( item ) => item.textContent )
		).toEqual( [ 'Theme size', '13', '20', '36' ] );
	} );

	it( 'rounds a size the theme gives in rem to whole pixels', async () => {
		const user = userEvent.setup();
		render(
			<WritingSizeDropdown
				fontSizes={ [
					{ slug: 'medium', name: 'Medium', size: '1.38rem' },
				] }
				onSelectPreset={ noop }
				onSetCustom={ noop }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Size' } ) );

		// 1.38rem is 22.08px, which is no use as a label.
		expect(
			screen
				.getAllByRole( 'menuitemradio' )
				.map( ( item ) => item.textContent )
		).toEqual( [ 'Theme size', '22' ] );
	} );

	it( 'falls back to the name for a size that has no number', async () => {
		const user = userEvent.setup();
		render(
			<WritingSizeDropdown
				fontSizes={ FLUID_FONT_SIZES }
				onSelectPreset={ noop }
				onSetCustom={ noop }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Size' } ) );

		expect(
			screen
				.getAllByRole( 'menuitemradio' )
				.map( ( item ) => item.textContent )
		).toEqual( [ 'Theme size', '13', 'Headline' ] );
	} );

	it( 'shows the number of the size in use on the toolbar', () => {
		render(
			<WritingSizeDropdown
				fontSizes={ FONT_SIZES }
				value="medium"
				onSelectPreset={ noop }
				onSetCustom={ noop }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Size' } )
		).toHaveTextContent( '20' );
	} );

	it( 'marks a size of your own with an asterisk', () => {
		render(
			<WritingSizeDropdown
				fontSizes={ FONT_SIZES }
				customSize="33px"
				onSelectPreset={ noop }
				onSetCustom={ noop }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Size' } )
		).toHaveTextContent( '33*' );
	} );

	it( 'hands back the preset that was chosen', async () => {
		const user = userEvent.setup();
		const onSelectPreset = vi.fn();
		render(
			<WritingSizeDropdown
				fontSizes={ FONT_SIZES }
				onSelectPreset={ onSelectPreset }
				onSetCustom={ noop }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Size' } ) );
		await user.click( screen.getByRole( 'menuitemradio', { name: '36' } ) );

		expect( onSelectPreset ).toHaveBeenCalledWith( 'large' );
	} );
} );
