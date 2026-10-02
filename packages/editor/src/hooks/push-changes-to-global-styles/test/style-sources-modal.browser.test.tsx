import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent as user } from 'vitest/browser';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import StyleSourcesModal from '../style-sources-modal';
import type { StyleSourceRow } from '../style-sources-modal';

const rows: StyleSourceRow[] = [
	{
		id: 'typography.lineHeight',
		path: [ 'typography', 'lineHeight' ],
		label: 'Line height',
		isChanged: false,
		formattedValue: 'inherit',
		source: 'Typography style',
		replaces: null,
	},
	{
		id: 'color.text',
		path: [ 'color', 'text' ],
		label: 'Text color',
		isChanged: true,
		formattedValue: 'Vivid Red',
		replaces: {
			formattedValue: 'Accent',
			source: '“Outline” block style variation',
		},
	},
	{
		id: 'typography.letterSpacing',
		path: [ 'typography', 'letterSpacing' ],
		label: 'Letter spacing',
		isChanged: true,
		formattedValue: '1px',
		replaces: null,
	},
];

async function renderModal() {
	const onReset = vi.fn();
	const onApply = vi.fn();
	await render(
		<StyleSourcesModal
			name="test/button"
			rows={ rows }
			variationTitle="Outline"
			onReset={ onReset }
			canApply={ () => true }
			onApply={ onApply }
			onRequestClose={ vi.fn() }
		/>
	);
	return { onReset, onApply };
}

describe( 'StyleSourcesModal', () => {
	beforeAll( () => {
		registerBlockType( 'test/button', {
			apiVersion: 3,
			title: 'Button',
			category: 'design',
			attributes: {},
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/button' );
	} );

	it( 'names the block and variation, and counts the overrides', async () => {
		await renderModal();
		expect(
			screen.getByText( 'Button block · Outline style' )
		).toBeInTheDocument();
		expect(
			screen.getByText( '2 of 3 styles changed on this block' )
		).toBeInTheDocument();
	} );

	it( 'lists changed rows first, then inherited rows, in one table', async () => {
		await renderModal();
		expect( screen.getAllByRole( 'table' ) ).toHaveLength( 1 );
		const labels = screen
			.getAllByRole( 'row' )
			.slice( 1 )
			.map( ( row ) => row.textContent );
		expect( labels[ 0 ] ).toContain( 'Text color' );
		expect( labels[ 1 ] ).toContain( 'Letter spacing' );
		expect( labels[ 2 ] ).toContain( 'Line height' );
	} );

	it( 'shows the theme value under a changed style and where it is set', async () => {
		await renderModal();
		const row = screen.getByRole( 'row', { name: /Text color/ } );
		expect( within( row ).getByText( 'This block' ) ).toBeInTheDocument();
		expect( within( row ).getByText( 'Accent' ) ).toBeInTheDocument();
		expect(
			within( row ).getByText( '“Outline” block style variation' )
		).toBeInTheDocument();
	} );

	it( 'shows a changed style with nothing set underneath', async () => {
		await renderModal();
		const row = screen.getByRole( 'row', { name: /Letter spacing/ } );
		expect( within( row ).getByText( 'This block' ) ).toBeInTheDocument();
		expect( within( row ).getByText( 'Not set' ) ).toBeInTheDocument();
		expect( within( row ).getByText( '\u2014' ) ).toBeInTheDocument();
	} );

	it( 'shows an inherit value as inherit', async () => {
		await renderModal();
		const row = screen.getByRole( 'row', { name: /Line height/ } );
		expect( within( row ).getByText( 'inherit' ) ).toBeInTheDocument();
		expect(
			within( row ).getByText( 'Typography style' )
		).toBeInTheDocument();
		expect( within( row ).getAllByText( '\u2014' ) ).toHaveLength( 2 );
	} );

	it( 'disables the checkbox of a row not changed on this block', async () => {
		await renderModal();
		expect(
			screen.getByRole( 'checkbox', {
				name: 'Line height, not changed on this block',
			} )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.getByRole( 'checkbox', { name: 'Text color' } )
		).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'applies or resets only the selected rows', async () => {
		const { onReset, onApply } = await renderModal();

		const apply = screen.getByRole( 'button', {
			name: 'Apply selected globally',
		} );
		const reset = screen.getByRole( 'button', { name: 'Reset selected' } );
		expect( apply ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( reset ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click(
			screen.getByRole( 'checkbox', { name: 'Text color' } )
		);
		await user.click( apply );
		expect( onApply ).toHaveBeenLastCalledWith( [ rows[ 1 ] ] );

		await user.click(
			screen.getByRole( 'checkbox', { name: 'Letter spacing' } )
		);
		await user.click( reset );
		expect( onReset ).toHaveBeenLastCalledWith( [ rows[ 2 ] ] );
	} );

	it( 'counts and selects changed styles only in the footer', async () => {
		await renderModal();
		expect(
			screen.getByText( '0 of 2 changed styles selected' )
		).toBeInTheDocument();

		await user.click(
			screen.getByRole( 'checkbox', { name: 'Text color' } )
		);
		expect(
			screen.getByText( '1 of 2 changed styles selected' )
		).toBeInTheDocument();
		expect( screen.queryByText( /Items?/ ) ).not.toBeInTheDocument();
	} );

	it( 'has no per row reset, Reset all or footer Close', async () => {
		await renderModal();
		expect(
			screen.queryByRole( 'button', { name: /^Reset text color/ } )
		).not.toBeInTheDocument();
		expect( screen.queryByText( 'Reset all' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Close' ) ).not.toBeInTheDocument();
	} );
} );
