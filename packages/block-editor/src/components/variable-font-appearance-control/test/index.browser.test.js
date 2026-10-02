import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { createElement } from '@wordpress/element';
import VariableFontAppearanceControl from '../index';

const faces = [
	{ fontFamily: 'Range Test', fontStyle: 'normal', fontWeight: '250 750' },
];

describe( 'VariableFontAppearanceControl', () => {
	it( 'only offers weight presets inside the range', async () => {
		const user = userEvent.setup();
		await render(
			createElement( VariableFontAppearanceControl, {
				value: { fontStyle: 'normal', fontWeight: '400' },
				onChange: vi.fn(),
				fontFamilyFaces: faces,
			} )
		);

		await user.click( page.getByRole( 'combobox', { name: /Weight/ } ) );

		await expect
			.element( page.getByRole( 'option', { name: 'Light (300)' } ) )
			.toBeVisible();
		await expect
			.element( page.getByRole( 'option', { name: 'Bold (700)' } ) )
			.toBeVisible();
		await expect
			.element(
				page.getByRole( 'option', { name: 'Extra Light (200)' } )
			)
			.not.toBeInTheDocument();
	} );

	it( 'keeps the weight when the style changes', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		await render(
			createElement( VariableFontAppearanceControl, {
				value: { fontStyle: 'italic', fontWeight: '300' },
				onChange,
				fontFamilyFaces: faces,
			} )
		);

		await user.click( page.getByRole( 'combobox', { name: /Style/ } ) );
		await user.click( page.getByRole( 'option', { name: 'Regular' } ) );

		expect( onChange ).toHaveBeenLastCalledWith( {
			fontStyle: 'normal',
			fontWeight: '300',
		} );
	} );

	it( 'keeps the style when a preset weight is chosen', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		await render(
			createElement( VariableFontAppearanceControl, {
				value: { fontStyle: 'italic', fontWeight: '300' },
				onChange,
				fontFamilyFaces: faces,
			} )
		);

		await user.click( page.getByRole( 'combobox', { name: /Weight/ } ) );
		await user.click( page.getByRole( 'option', { name: 'Bold (700)' } ) );

		expect( onChange ).toHaveBeenLastCalledWith( {
			fontStyle: 'italic',
			fontWeight: '700',
		} );
	} );
} );
