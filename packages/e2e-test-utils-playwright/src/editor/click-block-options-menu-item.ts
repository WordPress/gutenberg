/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Clicks a block toolbar button.
 *
 * @param this
 * @param label The text string of the button label.
 */
export async function clickBlockOptionsMenuItem( this: Editor, label: string ) {
	await this.clickBlockToolbarButton( 'Options' );
	await this.page
		.locator(
			`role=menu[name="Options"i] >> role=menuitem[name="${ label }"i]`
		)
		.click();
}
