/**
 * Visits general settings page and changes the timezone to the given value.
 *
 * @this {import('./').TestUtils}
 *
 * @param {string} timezone Value of the timezone to set.
 *
 * @return {string} Value of the previous timezone.
 */
export async function changeSiteTimezone( timezone ) {
	await this.switchUserToAdmin();
	await this.visitAdminPage( 'options-general.php' );

	// find the selected timezone
	const oldTimezone = await this.page.$eval(
		'select[id^="timezone_string"] option:checked',
		( e ) => e.text
	);

	await this.page.selectOption( '#timezone_string', timezone );

	await Promise.all( [
		this.page.waitForNavigation(),
		this.page.click( 'input:has-text("Save Changes")' ),
	] );

	await this.switchUserToTest();

	return oldTimezone;
}
