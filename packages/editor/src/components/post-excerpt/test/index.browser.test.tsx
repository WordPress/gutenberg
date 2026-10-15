import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { isAppleOS } from '@wordpress/keycodes';
import { store as editorStore } from '../../../store';
import { createEditorRegistry, ExcerptEditor } from './fixtures/editor';

describe( 'PostExcerpt native history', () => {
	it( 'undoes and redoes local typing without changing the editor history', async () => {
		const registry = await createEditorRegistry();
		const screen = await render(
			<ExcerptEditor registry={ registry } updateOnBlur />
		);
		const textarea = screen.getByRole( 'textbox' );
		const modifier = isAppleOS() ? 'Meta' : 'Control';
		await userEvent.click( textarea );
		await userEvent.keyboard( '{End}x' );

		await userEvent.keyboard( `{${ modifier }>}z{/${ modifier }}` );

		await expect.element( textarea ).toHaveValue( 'Original excerpt' );
		expect(
			registry.select( editorStore ).getEditedPostAttribute( 'title' )
		).toBe( 'Edited title' );
		expect(
			registry.select( editorStore ).getEditedPostAttribute( 'excerpt' )
		).toBe( 'Original excerpt' );

		await userEvent.keyboard(
			`{${ modifier }>}{Shift>}z{/Shift}{/${ modifier }}`
		);

		await expect.element( textarea ).toHaveValue( 'Original excerptx' );
		expect(
			registry.select( editorStore ).getEditedPostAttribute( 'title' )
		).toBe( 'Edited title' );
		await userEvent.tab();
		expect(
			registry.select( editorStore ).getEditedPostAttribute( 'excerpt' )
		).toBe( 'Original excerptx' );
	} );
} );
