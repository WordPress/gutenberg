/**
 * Internal dependencies
 */
import { visitAdminPage } from './visit-admin-page';
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';

/**
 * Visits general settings page and changes the timezone to the given value.
 *
 * @param {string} timezone Value of the timezone to set.
 *
 * @return {string} Value of the previous timezone.
 */
export async function changeSiteTimezone( timezone ) {
	await switchUserToAdmin();
	await visitAdminPage( 'options-general.php' );

	const oldTimezone = await page.$eval(
		'#timezone_string',
		( element ) => element.options[ element.selectedIndex ].text
	);
	await page.select( '#timezone_string', timezone );
	await Promise.all( [
		page.click( '#submit' ),
		page.waitForNavigation( { waitUntil: 'networkidle0' } ),
	] );

	await switchUserToTest();

	return oldTimezone;
}
