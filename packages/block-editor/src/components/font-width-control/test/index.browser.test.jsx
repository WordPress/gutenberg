import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import FontWidthControl from '../index';

async function renderControl( fontFamilyFaces ) {
	await render(
		<FontWidthControl
			value={ undefined }
			onChange={ vi.fn() }
			fontFamilyFaces={ fontFamilyFaces }
		/>
	);
}

const openWidths = async () => {
	await userEvent.click( screen.getByRole( 'combobox', { name: /width/i } ) );
	return ( await screen.findAllByRole( 'option' ) )
		.map( ( option ) => option.textContent.trim() )
		.filter( ( name ) => name !== 'Default' );
};

describe( 'the widths offered', () => {
	it( 'offers the widths inside a variable range', async () => {
		await renderControl( [ { fontStretch: '25% 151%' } ] );
		const widths = await openWidths();
		expect( widths ).toContain( 'Ultra Condensed' );
		expect( widths ).toContain( 'Extra Expanded' );
		// 200% is past what the face declares.
		expect( widths ).not.toContain( 'Ultra Expanded' );
	} );

	it( 'offers only the widths a static family has faces for', async () => {
		// Two files, two widths. Nothing draws the seven in between.
		await renderControl( [
			{ fontStretch: 'normal', fontWeight: '400' },
			{ fontStretch: 'condensed', fontWeight: '400' },
		] );
		expect( await openWidths() ).toEqual( [ 'Condensed', 'Normal' ] );
	} );

	it( 'keeps a static width beside a variable interval', async () => {
		await renderControl( [
			{ fontStretch: '50% 125%' },
			{ fontStretch: '150%' },
		] );
		const widths = await openWidths();
		expect( widths ).toContain( 'Expanded' );
		expect( widths ).toContain( 'Extra Expanded' );
	} );

	it( 'offers no width to type for a static family', async () => {
		// A static family has the widths its files have and nothing between
		// them, so there is no value to reach with a slider.
		await renderControl( [
			{ fontStretch: 'normal' },
			{ fontStretch: 'condensed' },
		] );
		expect(
			screen.queryByRole( 'button', { name: /set custom width/i } )
		).not.toBeInTheDocument();
	} );

	it( 'does not offer one slider across disjoint variable intervals', async () => {
		await renderControl( [
			{ fontStretch: '50% 75%' },
			{ fontStretch: '125% 150%' },
		] );
		expect(
			screen.queryByRole( 'button', { name: /set custom width/i } )
		).not.toBeInTheDocument();
	} );
} );
