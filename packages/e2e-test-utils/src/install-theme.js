/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { visitAdminPage } from './visit-admin-page';

/**
 * Installs a theme from the WP.org repository.
 *
 * @param {string} slug        Theme slug.
 * @param {string?} searchTerm Search term to use if the theme is not findable by its slug.
 */
export async function installTheme( slug, searchTerm ) {
	await switchUserToAdmin();
	await visitAdminPage(
		'theme-install.php',
		`search=${ encodeURIComponent( searchTerm || slug ) }`
	);
	await page.waitForSelector( `div[data-slug="${ slug }"]` );

	const activateLink = await page.$(
		`div[data-slug="${ slug }"] .button.activate`
	);
	if ( activateLink ) {
		switchUserToTest();
		return;
	}

	await page.click( `.theme-install[data-slug="${ slug }"]` );
	await page.waitForSelector( `.theme[data-slug="${ slug }"] .activate` );
	await switchUserToTest();
}
