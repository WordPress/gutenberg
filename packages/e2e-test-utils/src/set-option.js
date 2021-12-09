/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { visitAdminPage } from './visit-admin-page';
import { switchUserToTest } from './switch-user-to-test';
import { pressKeyWithModifier } from './press-key-with-modifier';

/**
 * Sets a site option, from the options-general admin page.
 *
 * @param {string} setting The option, used to get the option by id.
 * @param {string} value   The value to set the option to.
 */
export async function setOption( setting, value ) {
	await switchUserToAdmin();
	await visitAdminPage( 'options-general.php' );

	await page.focus( `#${ setting }` );
	await pressKeyWithModifier( 'primary', 'a' );
	await page.type( `#${ setting }`, value );

	await Promise.all( [
		page.click( '#submit' ),
		page.waitForNavigation( { waitUntil: 'networkidle0' } ),
	] );

	await switchUserToTest();
}
