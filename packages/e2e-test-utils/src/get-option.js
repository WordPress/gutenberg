/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { visitAdminPage } from './visit-admin-page';
import { switchUserToTest } from './switch-user-to-test';

/**
 * Returns a site option, from the options admin page.
 *
 * @param {string} setting The option, used to get the option by id.
 * @return {string} The value of the option.
 */
export async function getOption( setting ) {
	await switchUserToAdmin();
	await visitAdminPage( 'options.php' );

	const value = await page.$eval(
		`#${ setting }`,
		( element ) => element.value
	);
	await switchUserToTest();
	return value;
}
