import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TypographyFontDropdown from '../font-dropdown';

const FONT_FAMILIES = [
	{
		slug: 'display',
		name: 'Playfair Display',
		fontFamily: '"Playfair Display", Georgia, serif',
	},
	{
		slug: 'body',
		name: 'Inter',
		fontFamily: 'Inter, system-ui, sans-serif',
	},
];

const noop = () => {};

describe( 'TypographyFontDropdown', () => {
	it( 'shows the font the block renders in when it sets none of its own', () => {
		render(
			<TypographyFontDropdown
				fontFamilies={ FONT_FAMILIES }
				defaultName="Inter"
				onChange={ noop }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Font' } )
		).toHaveTextContent( 'Inter' );
	} );

	it( 'prefers the font the block sets over the one it would render in', () => {
		render(
			<TypographyFontDropdown
				fontFamilies={ FONT_FAMILIES }
				value="display"
				defaultName="Inter"
				onChange={ noop }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Font' } )
		).toHaveTextContent( 'Playfair Display' );
	} );

	it( 'calls the font that follows the theme the default', async () => {
		const user = userEvent.setup();
		render(
			<TypographyFontDropdown
				fontFamilies={ FONT_FAMILIES }
				onChange={ noop }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Font' } ) );

		expect(
			screen
				.getAllByRole( 'menuitemradio' )
				.map( ( item ) => item.textContent )
		).toEqual( [ 'Default', 'Playfair Display', 'Inter' ] );
	} );

	it( 'clears the block’s own font when the default is chosen', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TypographyFontDropdown
				fontFamilies={ FONT_FAMILIES }
				value="display"
				onChange={ onChange }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Font' } ) );
		await user.click(
			screen.getByRole( 'menuitemradio', { name: 'Default' } )
		);

		expect( onChange ).toHaveBeenCalledWith( undefined );
	} );
} );
