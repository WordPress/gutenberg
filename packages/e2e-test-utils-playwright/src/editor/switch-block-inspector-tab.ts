/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Clicks on the block inspector tab button with the supplied label and waits
 * for the tab switch.
 *
 * @param            this
 * @param { string } ariaLabel Aria label to find tab button by.
 */

export async function switchBlockInspectorTab(
	this: Editor,
	ariaLabel: string
) {
	const tabButton = this.page.locator(
		`.block-editor-block-inspector__tabs button[aria-label="${ ariaLabel }"]`
	);
	const id = await tabButton.getAttribute( 'id' );

	await tabButton.click();
	await this.page.waitForSelector(
		`div[role="tabpanel"][aria-labelledby="${ id }"]`
	);
}
