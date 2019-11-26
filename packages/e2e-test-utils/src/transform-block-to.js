/**
 * Internal dependencies
 */
import { pressKeyWithModifier } from './press-key-with-modifier';

/**
 * Converts editor's block type.
 *
 * @param {string} name Block name.
 */
export async function transformBlockTo( name ) {
	// Transition to block toolbar by key combination.
	await pressKeyWithModifier( 'alt', 'F10' );

	// Press Enter in the focused toggle button.
	const switcherToggle = await page.waitForSelector( '.editor-block-switcher__toggle:focus' );
	await switcherToggle.press( 'Enter' );

	// Find the block button option within the switcher popover.
	const switcher = await page.$( '.block-editor-block-switcher__container' );
	const insertButton = ( await switcher.$x( `//button[.='${ name }']` ) )[ 0 ];

	// Clicks may fail if the button is out of view. Assure it is before click.
	await insertButton.evaluate( ( element ) => element.scrollIntoView() );
	await insertButton.click();

	// Wait for the transformed block to appear.
	const BLOCK_SELECTOR = '.block-editor-block-list__block';
	const BLOCK_NAME_SELECTOR = `[aria-label="Block: ${ name }"]`;
	await page.waitForSelector( `${ BLOCK_SELECTOR }${ BLOCK_NAME_SELECTOR }` );
}
