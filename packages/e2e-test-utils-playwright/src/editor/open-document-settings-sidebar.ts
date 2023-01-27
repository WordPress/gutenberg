/**
 * Internal dependencies
 */
import type { Editor } from './index';
import { expect } from '../test';

/**
 * Clicks on the button in the header which opens Document Settings sidebar when
 * it is closed.
 *
 * @param {Editor} this
 */
export async function openDocumentSettingsSidebar( this: Editor ) {
	const editorSettingsButton = this.page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', {
			name: 'Settings',
			disabled: false,
		} );

	const isEditorSettingsOpened =
		( await editorSettingsButton.getAttribute( 'aria-expanded' ) ) ===
		'true';

	if ( ! isEditorSettingsOpened ) {
		await editorSettingsButton.click();

		await expect(
			this.page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Close settings' } )
		).toBeVisible();
	}
}
