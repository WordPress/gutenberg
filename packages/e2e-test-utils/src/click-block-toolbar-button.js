/**
 * Internal dependencies
 */
import { showBlockToolbar } from './show-block-toolbar';

/**
 * Clicks a block toolbar button.
 *
 * @param {string} content The text string of the button label or content.
 * @param {string} type The type of button - 'ariaLabel' or 'text'.
 */
export async function clickBlockToolbarButton( content, type = 'ariaLabel' ) {
	await showBlockToolbar();
	const BLOCK_TOOLBAR_SELECTOR = 'block-editor-block-toolbar';
	let button;

	if ( type === 'ariaLabel' ) {
		const BUTTON_SELECTOR = `.${ BLOCK_TOOLBAR_SELECTOR } button[aria-label="${ content }"]`;
		button = await page.waitForSelector( BUTTON_SELECTOR );
	}

	if ( type === 'text' ) {
		[ button ] = await page.$x(
			`//*[@class='${ BLOCK_TOOLBAR_SELECTOR }']//button[contains(text(), '${ content }')]`
		);
	}

	await button.evaluate( ( element ) => element.scrollIntoView() );
	await button.click();
}
