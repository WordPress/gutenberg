/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Clicks a block toolbar button.
 *
 * @param {Editor} this
 * @param {string} label The text string of the button label.
 */
export async function clickBlockToolbarButton( this: Editor, label: string ) {
	await this.showBlockToolbar();

	const blockToolbar = this.page.locator(
		'role=toolbar[name="Block tools"i]'
	);
	const button = blockToolbar.locator( `role=button[name="${ label }"]` );

	await button.click();
}
