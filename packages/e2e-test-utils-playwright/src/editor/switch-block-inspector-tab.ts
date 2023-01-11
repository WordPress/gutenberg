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
	const inspectorTabButton = this.page.locator(
		`role=region[name="Editor settings"i] >> role=tab[name="${ label }"i]`
	);
	const id = await inspectorTabButton.getAttribute( 'id' );

	await inspectorTabButton.click();
	await expect(
		this.page.locator(
			`role=region[name="Editor settings"i] >> div[role="tabpanel"][aria-labelledby="${ id }"]`
		)
	).toBeVisible();
}
