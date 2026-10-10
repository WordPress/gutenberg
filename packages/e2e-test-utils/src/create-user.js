/**
 * External dependencies
 */
import { snakeCase } from 'lodash';

/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { visitAdminPage } from './visit-admin-page';

/**
 * Create a new user account.
 *
 * @param {string}  username           User name.
 * @param {Object?} object             Optional Settings for the new user account.
 * @param {string}  [object.firstName] First name.
 * @param {string}  [object.lastName]  Last name.
 * @param {string}  [object.role]      Role. Defaults to Administrator.
 *
 * @return {string} Password for the newly created user account.
 */
export async function createUser(
	username,
	{ firstName, lastName, role } = {}
) {
	await switchUserToAdmin();
	await visitAdminPage( 'user-new.php' );
	await page.waitForSelector( '#user_login', { visible: true } );
	await page.$eval(
		'#user_login',
		( el, value ) => ( el.value = value ),
		username
	);
	await page.$eval(
		'#email',
		( el, value ) => ( el.value = value ),
		snakeCase( username ) + '@example.com'
	);
	if ( firstName ) {
		await page.$eval(
			'#first_name',
			( el, value ) => ( el.value = value ),
			firstName
		);
	}
	if ( lastName ) {
		await page.$eval(
			'#last_name',
			( el, value ) => ( el.value = value ),
			lastName
		);
	}
	if ( role ) {
		await page.select( '#role', role );
	}

	await page.click( '#send_user_notification' );

	const password = await page.$eval( `#pass1`, ( element ) => element.value );

	await Promise.all( [
		page.click( '#createusersub' ),
		page.waitForNavigation( { waitUntil: 'networkidle0' } ),
	] );
	await switchUserToTest();
	return password;
}
