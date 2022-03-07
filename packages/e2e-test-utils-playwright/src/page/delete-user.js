/**
 * Delete a user account.
 *
 * @this {import('./').PageUtils}
 * @param {string} username User name.
 */
export async function deleteUser( username ) {
	await this.switchUserToAdmin();
	await this.visitAdminPage( 'users.php' );

	const [ userLink ] = await this.page.$x(
		`//td[@data-colname="Username"]//a[contains(text(), "${ username }")]`
	);

	if ( ! userLink ) {
		await this.switchUserToTest();
		return;
	}

	// Focus to unveil actions.
	await userLink.focus();

	// Tab twice to focus 'Delete'
	await this.page.keyboard.press( 'Tab' );
	await this.page.keyboard.press( 'Tab' );

	await Promise.all( [
		this.page.keyboard.press( 'Enter' ),
		this.page.waitForNavigation( { waitUntil: 'networkidle0' } ),
	] );

	// If there's content owned by this user, delete it.
	const deleteContentRadioButton = await this.page.$(
		'input[type="radio"][name="delete_option"][value="delete"]'
	);
	if ( deleteContentRadioButton ) {
		await deleteContentRadioButton.click();
	}

	// Confirm.
	await Promise.all( [
		this.page.click( 'input#submit' ),
		this.page.waitForNavigation( { waitUntil: 'networkidle0' } ),
	] );
	await this.switchUserToTest();
}
