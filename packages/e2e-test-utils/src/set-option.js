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
 * @param {string} setting   The option, used to get the option by id.
 * @param {string} value     The value to set the option to.
 * @param {string} adminPage The url of the admin page to visit. Default: options-general.php.
 *
 */
export async function setOption(
	setting,
	value,
	adminPage = 'options-general.php'
) {
	await switchUserToAdmin();
	await visitAdminPage( adminPage );

	const optionType = await page.$eval(
		`#${ setting }`,
		( element ) => element.type
	);
	if ( optionType === 'checkbox' ) {
		const isChecked = await page.$eval(
			`#${ setting }`,
			( element ) => element.checked === true
		);
		if ( ( value && ! isChecked ) || ( ! value && isChecked ) ) {
			await page.click( `#${ setting }` );
		}
	} else if ( optionType === 'select-one' ) {
		await page.select( `#${ setting }`, value );
	} else {
		// Update other options types.
		await page.focus( `#${ setting }` );
		await pressKeyWithModifier( 'primary', 'a' );
		await page.type( `#${ setting }`, value );
	}

	await Promise.all( [
		page.click( '#submit' ),
		page.waitForNavigation( { waitUntil: 'networkidle0' } ),
	] );
	await switchUserToTest();
}
