/**
 * Internal dependencies
 */
import { showBlockToolbar } from './show-block-toolbar';

/**
 * Clicks a block toolbar button.
 *
 * @param {string} buttonAriaLabel The aria label of the button to click.
 */
export async function clickBlockToolbarButton( buttonAriaLabel ) {
	await showBlockToolbar();

	const BLOCK_TOOLBAR_SELECTOR = '.block-editor-block-toolbar';
	const BUTTON_SELECTOR = `${ BLOCK_TOOLBAR_SELECTOR } button[aria-label="${ buttonAriaLabel }"]`;

	const button = await page.waitForSelector( BUTTON_SELECTOR );
	await button.evaluate( ( element ) => element.scrollIntoView() );
	await button.click();
}
