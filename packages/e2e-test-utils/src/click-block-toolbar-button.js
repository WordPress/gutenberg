/**
 * Internal dependencies
 */
import { showBlockToolbar } from './show-block-toolbar';

/**
 * Clicks a block toolbar button.
 *
 * @param {string} label  The text string of the button label.
 * @param {string} [type] The type of button label: 'ariaLabel' or 'content'.
 */
export async function clickBlockToolbarButton( label, type = 'ariaLabel' ) {
	await showBlockToolbar();
	const BLOCK_TOOLBAR_SELECTOR = '.block-editor-block-toolbar';

	if ( type === 'ariaLabel' ) {
		return await page.click(
			`${ BLOCK_TOOLBAR_SELECTOR } button[aria-label="${ label }"]`
		);
	}

	if ( type === 'content' ) {
		return await page.click(
			`${ BLOCK_TOOLBAR_SELECTOR } button:text("${ label }")`
		);
	}
}
