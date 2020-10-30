/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { visitAdminPage } from './visit-admin-page';

/**
 * Ativate a theme.
 *
 * @param {string} slug Theme slug.
 */
export async function activateTheme( slug ) {
	await switchUserToAdmin();
	await visitAdminPage( 'themes.php' );
	const themeCard = await page.waitForSelector(
		`.theme[data-slug="${ slug }"]`
	);
	const className = await page.evaluate( ( el ) => el.className, themeCard );
	const isActive = className.includes( 'active' );
	if ( isActive ) {
		return;
	}
	const activateButton = await themeCard.$( '.button.activate' );
	await activateButton.click();
	await switchUserToTest();
}
