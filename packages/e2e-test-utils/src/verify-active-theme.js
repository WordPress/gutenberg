/**
 * Internal dependencies
 */
import { createURL } from './create-url';

/**
 * Verifies that the expected theme for the tests is active.
 *
 * @param {string} theme The expected theme's slug.
 */
export async function verifyActiveTheme( theme ) {
	await page.goto( createURL( '' ) );
	if ( ( await page.$( `#${ theme }-style-css` ) ) === null ) {
		process.exit( `Test suite must be run using the ${ theme } theme.` );
	}
}
