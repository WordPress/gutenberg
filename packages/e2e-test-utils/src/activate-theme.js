/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { visitAdminPage } from './visit-admin-page';
import { isCurrentURL } from './is-current-url';

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
		await switchUserToTest();
		return;
	}

	await Promise.all( [
		page.click( `div[data-slug="${ slug }"] .button.activate` ),
		page.waitForNavigation( { waitUntil: 'networkidle0' } ),
	] );

	if ( ! isCurrentURL( 'themes.php' ) ) {
		await visitAdminPage( 'themes.php' );
	}
	await page.waitForSelector( `div[data-slug="${ slug }"].active`, {
		timeout: 45000,
	} );
	await switchUserToTest();
}
