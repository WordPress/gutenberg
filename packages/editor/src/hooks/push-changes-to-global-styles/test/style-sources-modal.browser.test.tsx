import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent as user } from 'vitest/browser';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import StyleSourcesModal from '../style-sources-modal';
import type { StyleSourceRow } from '../style-sources-modal';

const rows: StyleSourceRow[] = [
	{
		id: 'color.text',
		path: [ 'color', 'text' ],
		label: 'Text color',
		isChanged: true,
		formattedValue: 'Vivid Red',
		replaces: {
			formattedValue: 'currentColor',
			source: 'Outline style',
		},
	},
	{
		id: 'typography.fontWeight',
		path: [ 'typography', 'fontWeight' ],
		label: 'Font weight',
		isChanged: false,
		formattedValue: '600',
		source: 'Button block',
		replaces: null,
	},
	{
		id: 'shadow',
		path: [ 'shadow' ],
		label: 'Shadow',
		isChanged: true,
		formattedValue: 'Natural',
		replaces: null,
	},
];

async function renderModal( modalRows = rows ) {
	const onReset = vi.fn();
	const onApply = vi.fn();
	await render(
		<StyleSourcesModal
			name="test/button"
			rows={ modalRows }
			onReset={ onReset }
			canApply={ ( row ) => row.id !== 'shadow' }
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

	it( 'names the block and splits changed and inherited styles', async () => {
		await renderModal();
		expect(
			screen.getByRole( 'heading', { name: 'Button styles' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { name: 'Changed on this block (2)' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { name: 'Inherited styles (1)' } )
		).toBeInTheDocument();
		expect( screen.getByRole( 'listbox' ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'table' ) ).toHaveLength( 1 );
	} );

	it( 'starts with every changed style selected', async () => {
		await renderModal();
		expect(
			screen.getByRole( 'option', { name: /Text color/ } )
		).toHaveAttribute( 'aria-selected', 'true' );
		expect(
			screen.getByRole( 'option', { name: /Shadow/ } )
		).toHaveAttribute( 'aria-selected', 'true' );
		expect(
			screen.queryByRole( 'option', { name: /Font weight/ } )
		).not.toBeInTheDocument();
	} );

	it( 'shows the Global Styles value a change overrides, and where it is set', async () => {
		await renderModal();
		const row = screen.getByRole( 'option', { name: /Text color/ } );
		expect( within( row ).getByText( 'Vivid Red' ) ).toBeInTheDocument();
		expect( within( row ).getByText( 'currentColor' ) ).toBeInTheDocument();
		expect(
			within( row ).getByText( 'Outline style' )
		).toBeInTheDocument();
	} );

	it( 'says when a change overrides nothing and cannot go global', async () => {
		await renderModal();
		const row = screen.getByRole( 'option', { name: /Shadow/ } );
		expect( within( row ).getByText( 'Not set' ) ).toBeInTheDocument();
		expect(
			within( row ).getByText( 'Can’t apply globally' )
		).toBeInTheDocument();
	} );

	it( 'names the source of each inherited style', async () => {
		await renderModal();
		const row = screen.getByRole( 'row', { name: /Font weight/ } );
		expect( within( row ).getByText( '600' ) ).toBeInTheDocument();
		expect( within( row ).getByText( 'Button block' ) ).toBeInTheDocument();
	} );

	it( 'applies only what Global Styles can take, and resets the selection', async () => {
		const { onReset, onApply } = await renderModal();

		await user.click(
			screen.getByRole( 'button', { name: 'Apply globally' } )
		);
		expect( onApply ).toHaveBeenLastCalledWith( [ rows[ 0 ] ] );

		await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );
		expect( onReset ).toHaveBeenLastCalledWith( [ rows[ 0 ], rows[ 2 ] ] );
	} );

	it( 'shows only the inherited styles when nothing is changed', async () => {
		await renderModal( [ rows[ 1 ] ] );
		expect(
			screen.getByText(
				'This block doesn’t change any styles. Everything below comes from Global Styles.'
			)
		).toBeInTheDocument();
		expect( screen.getAllByRole( 'table' ) ).toHaveLength( 1 );
		expect(
			screen.queryByRole( 'button', { name: 'Apply globally' } )
		).not.toBeInTheDocument();
	} );
} );
