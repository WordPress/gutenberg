/**
 * Sets a site option, from the options-general admin page.
 *
 * @this {import('./').TestUtils}
 *
 * @param {string} setting The option, used to get the option by id.
 * @param {string} value   The value to set the option to.
 */
export async function setOption( setting, value ) {
	await setOption.switchUserToAdmin();
	await this.visitAdminPage( 'options-general.php' );

	await this.page.press( `#${ setting }`, 'Meta+KeyA' );
	await this.page.type( `#${ setting }`, value );

	await Promise.all( [
		this.page.waitForNavigation(),
		this.page.click( 'input:has-text("Save Changes")' ),
	] );

	await this.switchUserToTest();
}
