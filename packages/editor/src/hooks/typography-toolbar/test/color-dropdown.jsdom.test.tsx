import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Icon, textColor } from '@wordpress/icons';
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
			<TypographyColorDropdown
				label="Text color"
				icon={ <Icon icon={ textColor } /> }
				colors={ COLORS }
				onChange={ noop }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Text color' } )
		);

		expect(
			screen.getByRole( 'option', { name: 'Ink' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'option', { name: 'Clay' } )
		).toBeInTheDocument();
	} );

	it( 'takes the name it is given', async () => {
		const user = userEvent.setup();
		render(
			<TypographyColorDropdown
				label="Background color"
				icon={ <Icon icon={ textColor } /> }
				colors={ COLORS }
				onChange={ noop }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Background color' } )
		);

		expect(
			screen.getByRole( 'option', { name: 'Ink' } )
		).toBeInTheDocument();
	} );

	it( 'hands back the colour and the preset it came from', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TypographyColorDropdown
				label="Text color"
				icon={ <Icon icon={ textColor } /> }
				colors={ COLORS }
				onChange={ onChange }
			/>
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
				label="Text color"
				icon={ <Icon icon={ textColor } /> }
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
