import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TypographySizeDropdown from '../size-dropdown';

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

describe( 'TypographySizeDropdown', () => {
	it( 'names each theme size by its number, as a word processor does', async () => {
		const user = userEvent.setup();
		render(
			<TypographySizeDropdown
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
		).toEqual( [ 'Default', '13', '20', '36' ] );
	} );

	it( 'rounds a size the theme gives in rem to whole pixels', async () => {
		const user = userEvent.setup();
		render(
			<TypographySizeDropdown
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
		).toEqual( [ 'Default', '22' ] );
	} );

	it( 'falls back to the name for a size that has no number', async () => {
		const user = userEvent.setup();
		render(
			<TypographySizeDropdown
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
		).toEqual( [ 'Default', '13', 'Headline' ] );
	} );

	it( 'shows the size the block renders at when it sets none of its own', () => {
		render(
			<TypographySizeDropdown
				fontSizes={ FONT_SIZES }
				defaultSize="17px"
				onSelectPreset={ noop }
				onSetCustom={ noop }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Size' } )
		).toHaveTextContent( '17' );
	} );

	it( 'prefers the size the block sets over the one it would render at', () => {
		render(
			<TypographySizeDropdown
				fontSizes={ FONT_SIZES }
				value="large"
				defaultSize="17px"
				onSelectPreset={ noop }
				onSetCustom={ noop }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Size' } )
		).toHaveTextContent( '36' );
	} );

	it( 'shows the number of the size in use on the toolbar', () => {
		render(
			<TypographySizeDropdown
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
			<TypographySizeDropdown
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

	it( 'names the default by the size it stands for', async () => {
		const user = userEvent.setup();
		render(
			<TypographySizeDropdown
				fontSizes={ FONT_SIZES }
				defaultSize="17px"
				onSelectPreset={ noop }
				onSetCustom={ noop }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Size' } ) );

		expect(
			screen
				.getAllByRole( 'menuitemradio' )
				.map( ( item ) => item.textContent )
		).toEqual( [ '17 - default', '13', '20', '36' ] );
	} );

	it( 'rounds the default to whole pixels too', async () => {
		const user = userEvent.setup();
		render(
			<TypographySizeDropdown
				fontSizes={ FONT_SIZES }
				defaultSize="1.38rem"
				onSelectPreset={ noop }
				onSetCustom={ noop }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Size' } ) );

		expect( screen.getAllByRole( 'menuitemradio' )[ 0 ] ).toHaveTextContent(
			'22 - default'
		);
	} );

	it( 'just says default when the size it stands for has no number', async () => {
		const user = userEvent.setup();
		render(
			<TypographySizeDropdown
				fontSizes={ FONT_SIZES }
				defaultSize="clamp(2rem, 2vw, 4rem)"
				onSelectPreset={ noop }
				onSetCustom={ noop }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Size' } ) );

		expect( screen.getAllByRole( 'menuitemradio' )[ 0 ] ).toHaveTextContent(
			'Default'
		);
	} );

	it( 'offers a slider for a size of your own, as the inspector does', async () => {
		const user = userEvent.setup();
		render(
			<TypographySizeDropdown
				fontSizes={ FONT_SIZES }
				onSelectPreset={ noop }
				onSetCustom={ noop }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Size' } ) );

		expect(
			screen.getByRole( 'slider', { name: 'Custom size' } )
		).toBeInTheDocument();
	} );

	it( 'sets a size of your own from the slider', async () => {
		const user = userEvent.setup();
		const onSetCustom = vi.fn();
		render(
			<TypographySizeDropdown
				fontSizes={ FONT_SIZES }
				onSelectPreset={ noop }
				onSetCustom={ onSetCustom }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Size' } ) );
		fireEvent.change(
			screen.getByRole( 'slider', { name: 'Custom size' } ),
			{ target: { value: '40' } }
		);

		expect( onSetCustom ).toHaveBeenCalledWith( 40 );
	} );

	it( 'starts the slider at the size the block renders at', async () => {
		const user = userEvent.setup();
		render(
			<TypographySizeDropdown
				fontSizes={ FONT_SIZES }
				defaultSize="17px"
				onSelectPreset={ noop }
				onSetCustom={ noop }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Size' } ) );

		expect(
			screen.getByRole( 'slider', { name: 'Custom size' } )
		).toHaveValue( '17' );
	} );

	it( 'hands back the preset that was chosen', async () => {
		const user = userEvent.setup();
		const onSelectPreset = vi.fn();
		render(
			<TypographySizeDropdown
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
