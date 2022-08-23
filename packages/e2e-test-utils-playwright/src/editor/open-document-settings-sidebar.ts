/**
 * Internal dependencies
 */
import type { Editor } from './index';
const { expect } = require( '../test' );

/**
 * Clicks on the button in the header which opens Document Settings sidebar when it is closed.
 *
 * @param {Editor} this
 */
export async function openDocumentSettingsSidebar( this: Editor ) {
	const editorSettings = this.page.locator(
		'role=region[name="Editor settings"i]'
	);

	if ( ! ( await editorSettings.isVisible() ) ) {
		await this.page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Settings"i]'
		);

		await expect( editorSettings ).toBeVisible();
	}
}
