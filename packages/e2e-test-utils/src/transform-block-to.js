/**
 * Internal dependencies
 */
import { waitForAnimation } from './wait-for-animation';

/**
 * Converts editor's block type.
 *
 * @param {string} name Block name.
 */
export async function transformBlockTo( name ) {
	await page.mouse.move( 200, 300, { steps: 10 } );
	await page.mouse.move( 250, 350, { steps: 10 } );
	await page.click( '.editor-block-switcher__toggle' );
	await waitForAnimation();
	await page.waitForSelector( `.editor-block-types-list__item[aria-label="${ name }"]` );
	await page.click( `.editor-block-types-list__item[aria-label="${ name }"]` );
}
