import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlotFillProvider, Toolbar } from '@wordpress/components';
import FormatToolbar, { SelectionFormatToolbar } from '../format-toolbar';
import { RichTextToolbarButton } from '../toolbar-button';

function Fills() {
	return (
		<>
			<RichTextToolbarButton
				name="bold"
				title="Bold"
				onClick={ () => {} }
			/>
			<RichTextToolbarButton
				name="text-color"
				title="Highlight"
				onClick={ () => {} }
			/>
			<RichTextToolbarButton
				name="image"
				title="Inline image"
				onClick={ () => {} }
			/>
			<RichTextToolbarButton
				name="footnote"
				title="Footnote"
				onClick={ () => {} }
			/>
			<RichTextToolbarButton
				name="math"
				title="Math"
				onClick={ () => {} }
			/>
			<RichTextToolbarButton title="Strikethrough" onClick={ () => {} } />
		</>
	);
}

describe( 'FormatToolbar', () => {
	it( 'keeps the named highlight and inserting formats in the More menu', async () => {
		const user = userEvent.setup();
		render(
			<SlotFillProvider>
				<Toolbar label="Format tools">
					<FormatToolbar />
				</Toolbar>
				<Fills />
			</SlotFillProvider>
		);

		expect( screen.getByRole( 'button', { name: 'Bold' } ) ).toBeVisible();
		await user.click( screen.getByRole( 'button', { name: 'More' } ) );
		expect(
			screen
				.getAllByRole( 'menuitem' )
				.map( ( item ) => item.textContent )
		).toEqual( [
			'Footnote',
			'Highlight',
			'Inline image',
			'Math',
			'Strikethrough',
		] );
	} );
} );

describe( 'SelectionFormatToolbar', () => {
	it( 'shows highlight with the formats and leaves inserting out', async () => {
		const user = userEvent.setup();
		render(
			<SlotFillProvider>
				<Toolbar label="Format tools">
					<SelectionFormatToolbar />
				</Toolbar>
				<Fills />
			</SlotFillProvider>
		);

		expect( screen.getByRole( 'button', { name: 'Bold' } ) ).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Highlight' } )
		).toBeVisible();
		await user.click( screen.getByRole( 'button', { name: 'More' } ) );
		expect(
			screen
				.getAllByRole( 'menuitem' )
				.map( ( item ) => item.textContent )
		).toEqual( [ 'Strikethrough' ] );
	} );
} );
