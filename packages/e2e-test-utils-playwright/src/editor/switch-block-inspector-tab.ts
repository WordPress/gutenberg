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
	const sidebar = this.page.getByRole( 'region', {
		name: 'Editor settings',
	} );
	await sidebar.getByRole( 'tab', { name: ariaLabel } ).click();
	await sidebar.getByRole( 'tabpanel', { name: ariaLabel } ).waitFor();
}
