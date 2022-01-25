/**
 * Deactivates an active plugin.
 *
 * @this {import('./').TestUtils}
 * @param {string} slug Plugin slug.
 */
export async function deactivatePlugin( slug ) {
	await this.switchUserToAdmin();
	await this.visitAdminPage( 'plugins.php' );
	const deleteLink = await this.page.$(
		`tr[data-slug="${ slug }"] .delete a`
	);
	if ( deleteLink ) {
		await this.switchUserToTest();
		return;
	}
	await this.page.click( `tr[data-slug="${ slug }"] .deactivate a` );
	await this.page.waitForSelector( `tr[data-slug="${ slug }"] .delete a` );
	await this.switchUserToTest();
}
