/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { visitAdminPage } from './visit-admin-page';

/**
 * Activates an installed theme.
 *
 * @param {string} slug Theme slug.
 */
export async function activateTheme( slug ) {
	await switchUserToAdmin();
	await visitAdminPage( 'themes.php' );

	const activateButton = await page.$(
		`div[data-slug="${ slug }"] .button.activate`
	);
	if ( ! activateButton ) {
		switchUserToTest();
		return;
	}

	await page.click( `div[data-slug="${ slug }"] .button.activate` );
	await page.waitForSelector( `div[data-slug="${ slug }"].active` );
	await switchUserToTest();
}
