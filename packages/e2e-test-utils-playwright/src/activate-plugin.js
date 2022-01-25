/**
 * Activates an installed plugin.
 *
 * @this {import('./').TestUtils}
 * @param {string} slug Plugin slug.
 */
export async function activatePlugin( slug ) {
	await this.switchUserToAdmin();
	await this.visitAdminPage( 'plugins.php' );
	const disableLink = await this.page.$(
		`tr[data-slug="${ slug }"] .deactivate a`
	);
	if ( disableLink ) {
		await this.switchUserToTest();
		return;
	}
	await this.page.click( `tr[data-slug="${ slug }"] .activate a` );
	await this.page.waitForSelector(
		`tr[data-slug="${ slug }"] .deactivate a`
	);
	await this.switchUserToTest();
}
