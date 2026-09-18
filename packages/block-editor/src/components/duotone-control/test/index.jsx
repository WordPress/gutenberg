import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DuotoneControl from '../';

// Adding two custom duotones in Global Styles seeds both from the palette's
// darkest and lightest colors, so two presets holding the same pair is the
// ordinary case. Only the slug tells them apart.
const DUPLICATE_PALETTE = [
	{
		name: 'Duotone 1',
		slug: 'custom-duotone-1',
		colors: [ '#000000', '#ffffff' ],
	},
	{
		name: 'Duotone 2',
		slug: 'custom-duotone-2',
		colors: [ '#000000', '#ffffff' ],
	},
];

const COLOR_PALETTE = [
	{ color: '#000000', name: 'Black', slug: 'black' },
	{ color: '#ffffff', name: 'White', slug: 'white' },
];

async function openControl( user ) {
	await user.click(
		screen.getByRole( 'button', { name: 'Apply duotone filter' } )
	);
}

describe( 'DuotoneControl', () => {
	it( 'reports the slug of the duplicate that was picked', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<DuotoneControl
				duotonePalette={ DUPLICATE_PALETTE }
				colorPalette={ COLOR_PALETTE }
				value={ undefined }
				onChange={ onChange }
			/>
		);
		await openControl( user );

		await user.click(
			screen.getByRole( 'option', { name: 'Duotone: Duotone 2' } )
		);

		expect( onChange ).toHaveBeenCalledWith(
			[ '#000000', '#ffffff' ],
			1,
			'custom-duotone-2'
		);
	} );

	it( 'marks only the stored preset as selected when two share colors', async () => {
		const user = userEvent.setup();

		render(
			<DuotoneControl
				duotonePalette={ DUPLICATE_PALETTE }
				colorPalette={ COLOR_PALETTE }
				value={ [ '#000000', '#ffffff' ] }
				selectedSlug="custom-duotone-2"
				onChange={ jest.fn() }
			/>
		);
		await openControl( user );

		expect(
			screen.getByRole( 'option', { name: 'Duotone: Duotone 1' } )
		).toHaveAttribute( 'aria-selected', 'false' );
		expect(
			screen.getByRole( 'option', { name: 'Duotone: Duotone 2' } )
		).toHaveAttribute( 'aria-selected', 'true' );
	} );

	it( 'falls back to color matching when no slug is stored', async () => {
		const user = userEvent.setup();

		render(
			<DuotoneControl
				duotonePalette={ DUPLICATE_PALETTE }
				colorPalette={ COLOR_PALETTE }
				value={ [ '#000000', '#ffffff' ] }
				onChange={ jest.fn() }
			/>
		);
		await openControl( user );

		expect(
			screen.getByRole( 'option', { name: 'Duotone: Duotone 1' } )
		).toHaveAttribute( 'aria-selected', 'true' );
		expect(
			screen.getByRole( 'option', { name: 'Duotone: Duotone 2' } )
		).toHaveAttribute( 'aria-selected', 'true' );
	} );
} );
