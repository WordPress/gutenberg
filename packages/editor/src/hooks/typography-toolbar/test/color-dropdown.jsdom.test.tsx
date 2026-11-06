import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TypographyColorDropdown from '../color-dropdown';

const COLORS = [
	{ slug: 'ink', name: 'Ink', color: '#1a1a1a' },
	{ slug: 'clay', name: 'Clay', color: '#b4522d' },
];

const noop = () => {};

describe( 'TypographyColorDropdown', () => {
	it( 'offers the theme’s colours', async () => {
		const user = userEvent.setup();
		render(
			<TypographyColorDropdown colors={ COLORS } onChange={ noop } />
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Text color' } )
		);

		expect( screen.getByRole( 'option', { name: 'Ink' } ) ).toBeVisible();
		expect( screen.getByRole( 'option', { name: 'Clay' } ) ).toBeVisible();
	} );

	it( 'draws the colour as a line under the letter, not on it', () => {
		render(
			<TypographyColorDropdown
				colors={ COLORS }
				value="#b4522d"
				onChange={ noop }
			/>
		);

		expect( screen.getByTestId( 'typography-color-bar' ) ).toHaveStyle( {
			background: '#b4522d',
		} );

		// The letter keeps the toolbar's own colour, so a pale choice still
		// leaves a legible icon.
		expect(
			screen.getByRole( 'button', { name: 'Text color' } )
		).not.toHaveStyle( { color: '#b4522d' } );
	} );

	it( 'shows the colour the block renders in when it sets none', () => {
		render(
			<TypographyColorDropdown
				colors={ COLORS }
				defaultColor="#1a1a1a"
				onChange={ noop }
			/>
		);

		expect( screen.getByTestId( 'typography-color-bar' ) ).toHaveStyle( {
			background: '#1a1a1a',
		} );
	} );

	it( 'hands back the colour and the preset it came from', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TypographyColorDropdown colors={ COLORS } onChange={ onChange } />
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Text color' } )
		);
		await user.click( screen.getByRole( 'option', { name: 'Clay' } ) );

		expect( onChange ).toHaveBeenCalledWith( '#b4522d', 'clay' );
	} );

	it( 'clears the colour when the one in use is chosen again', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TypographyColorDropdown
				colors={ COLORS }
				value="#b4522d"
				onChange={ onChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Text color' } )
		);
		await user.click( screen.getByRole( 'option', { name: 'Clay' } ) );

		expect( onChange ).toHaveBeenCalledWith( undefined, undefined );
	} );
} );
