import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlotFillProvider, Toolbar } from '@wordpress/components';
import FormatToolbar from '..';
import { RichTextToolbarButton } from '../../toolbar-button';

describe( 'FormatToolbar', () => {
	test( 'lists the dropdown formats in a fixed order, not by title', async () => {
		const user = userEvent.setup();

		render(
			<SlotFillProvider>
				<Toolbar label="Format tools">
					<FormatToolbar />
				</Toolbar>
				<RichTextToolbarButton title="Added by a plugin" />
				<RichTextToolbarButton
					name="acme/badge"
					title="Also added by a plugin"
				/>
				<RichTextToolbarButton name="code" title="Inline code" />
				<RichTextToolbarButton
					name="strikethrough"
					title="Strikethrough"
				/>
				<RichTextToolbarButton name="text-color" title="Highlight" />
			</SlotFillProvider>
		);

		await user.click( screen.getByRole( 'button', { name: 'More' } ) );

		expect(
			screen
				.getAllByRole( 'menuitem' )
				.map( ( item ) => item.textContent )
		).toEqual( [
			'Highlight',
			'Inline code',
			'Strikethrough',
			'Added by a plugin',
			'Also added by a plugin',
		] );
	} );

	test( 'lists a button in the toolbar when its name has a slot there', async () => {
		render(
			<SlotFillProvider>
				<Toolbar label="Format tools">
					<FormatToolbar />
				</Toolbar>
				<RichTextToolbarButton name="bold" title="Bold" />
			</SlotFillProvider>
		);

		expect(
			await screen.findByRole( 'button', { name: 'Bold' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'More' } )
		).not.toBeInTheDocument();
	} );

	test( 'does not render the dropdown without any fills', () => {
		render(
			<SlotFillProvider>
				<Toolbar label="Format tools">
					<FormatToolbar />
				</Toolbar>
			</SlotFillProvider>
		);

		expect(
			screen.queryByRole( 'button', { name: 'More' } )
		).not.toBeInTheDocument();
	} );
} );
