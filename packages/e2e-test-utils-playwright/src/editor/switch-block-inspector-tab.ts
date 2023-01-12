/**
 * Internal dependencies
 */
import type { Editor } from './index';
import { expect } from '../test';

/**
 * Clicks on the block inspector tab button with the supplied label and waits
 * for the tab switch.
 *
 * @param {Editor} this
 * @param {string} label
 */
export async function switchBlockInspectorTab( this: Editor, label: string ) {
	const editorSettings = this.page.locator(
		'role=region[name="Editor settings"i]'
	);
	await editorSettings.locator( `role=tab[name="${ label }"i]` ).click();
	await expect(
		editorSettings.locator( `role=tabpanel[name="${ label }"i]` )
	).toBeVisible();
}
