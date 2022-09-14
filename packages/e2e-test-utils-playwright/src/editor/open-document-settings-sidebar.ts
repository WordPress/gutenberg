/**
 * Internal dependencies
 */
import type { Editor } from './index';
import { expect } from '../test';

/**
 * Clicks on the button in the header which opens Document Settings sidebar when it is closed.
 *
 * @param {Editor} this
 */
export async function openDocumentSettingsSidebar( this: Editor ) {
	const editorSettingsButton = this.page.locator(
		'role=region[name="Editor top bar"i] >> role=button[name="Settings"i]'
	);

	const isEditorSettingsOpened =
		( await editorSettingsButton.getAttribute( 'aria-expanded' ) ) ===
		'true';

	if ( ! isEditorSettingsOpened ) {
		await editorSettingsButton.click();

		await expect(
			this.page.locator(
				'role=region[name="Editor settings"i] >> role=button[name^="Close settings"i]'
			)
		).toBeVisible();
	}
}
