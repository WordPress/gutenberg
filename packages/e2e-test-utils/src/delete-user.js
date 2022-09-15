/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { visitAdminPage } from './visit-admin-page';

/**
 * Delete a user account.
 *
 * @param {string} username User name.
 */
export async function deleteUser( username ) {
	await switchUserToAdmin();
	await visitAdminPage( 'users.php' );

	const [ userLink ] = await page.$x(
		`//td[@data-colname="Username"]//a[contains(text(), "${ username }")]`
	);

	if ( ! userLink ) {
		await switchUserToTest();
		return;
	}

	// Focus to unveil actions.
	await userLink.focus();

	// Tab twice to focus 'Delete'
	await page.keyboard.press( 'Tab' );
	await page.keyboard.press( 'Tab' );

	await Promise.all( [
		page.keyboard.press( 'Enter' ),
		page.waitForNavigation( { waitUntil: 'networkidle0' } ),
	] );

	// If there's content owned by this user, delete it.
	const deleteContentRadioButton = await page.$(
		'input[type="radio"][name="delete_option"][value="delete"]'
	);
	if ( deleteContentRadioButton ) {
		await deleteContentRadioButton.click();
	}

	// Confirm.
	await Promise.all( [
		page.click( 'input#submit' ),
		page.waitForNavigation( { waitUntil: 'networkidle0' } ),
	] );
	await switchUserToTest();
}
