/**
 * Internal dependencies
 */
import { showBlockToolbar } from './show-block-toolbar';

/**
 * Clicks a block toolbar button.
 *
 * @param {string} text The text string of the button label or content.
 * @param {string} type The type of button - 'icon' or 'text'.
 */
export async function clickBlockToolbarButton( text, type = 'icon' ) {
	await showBlockToolbar();
	const BLOCK_TOOLBAR_SELECTOR = 'block-editor-block-toolbar';
	let button;

	if ( type === 'icon' ) {
		const BUTTON_SELECTOR = `.${ BLOCK_TOOLBAR_SELECTOR } button[aria-label="${ text }"]`;
		button = await page.waitForSelector( BUTTON_SELECTOR );
	}

	if ( type === 'text' ) {
		[ button ] = await page.$x(
			`//*[@class='${ BLOCK_TOOLBAR_SELECTOR }']//button[contains(text(), '${ text }')]`
		);
	}

	await button.evaluate( ( element ) => element.scrollIntoView() );
	await button.click();
}
