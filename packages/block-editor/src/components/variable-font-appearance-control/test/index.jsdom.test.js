import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from '@wordpress/element';
import VariableFontAppearanceControl from '..';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockScrollIntoView();

const faces = [
	{ fontFamily: 'Range Test', fontStyle: 'normal', fontWeight: '250 750' },
];

async function renderControl( value, onChange = vi.fn() ) {
	render(
		createElement( VariableFontAppearanceControl, {
			value,
			onChange,
			fontFamilyFaces: faces,
		} )
	);
	// Let the controls settle before asserting.
	await screen.findByRole( 'combobox', { name: /Style/ } );
	return { onChange };
}

describe( 'VariableFontAppearanceControl', () => {
	it( 'shows a preset weight with its number', async () => {
		await renderControl( { fontStyle: 'normal', fontWeight: '300' } );

		expect(
			await screen.findByRole( 'combobox', { name: /Weight/ } )
		).toHaveTextContent( 'Light (300)' );
	} );

	it( 'opens a saved weight outside the range in the direct input, unchanged, with a note', async () => {
		const { onChange } = await renderControl( {
			fontStyle: 'normal',
			fontWeight: '200',
		} );

		expect(
			screen.getByRole( 'spinbutton', { name: 'Weight' } )
		).toHaveValue( 200 );
		const slider = screen.getByRole( 'slider', { name: 'Weight' } );
		expect( slider ).toHaveAttribute( 'min', '250' );
		expect( slider ).toHaveAttribute( 'max', '750' );
		expect(
			screen.getByText(
				/200 is outside this font’s weight range \(250–750\)/
			)
		).toBeInTheDocument();
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'lists a saved custom weight among the presets', async () => {
		const user = userEvent.setup();
		await renderControl( { fontStyle: 'normal', fontWeight: '420' } );

		await user.click(
			screen.getByRole( 'button', { name: 'Use weight preset' } )
		);

		expect(
			await screen.findByRole( 'combobox', { name: /Weight/ } )
		).toHaveTextContent( 'Custom (420)' );
	} );

	it( 'keeps the style when a weight is entered', async () => {
		const user = userEvent.setup();
		const { onChange } = await renderControl( {
			fontStyle: 'italic',
			fontWeight: '420',
		} );

		const input = screen.getByRole( 'spinbutton', { name: 'Weight' } );
		await user.clear( input );
		await user.type( input, '178' );

		expect( onChange ).toHaveBeenLastCalledWith( {
			fontStyle: 'italic',
			fontWeight: '178',
		} );
	} );

	it( 'shows the style as Appearance names it', async () => {
		await renderControl( { fontStyle: 'italic', fontWeight: '300' } );

		expect(
			screen.getByRole( 'combobox', { name: /Style/ } )
		).toHaveTextContent( 'Italic' );
	} );
} );
