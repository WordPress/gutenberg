/**
 * Activates an installed theme.
 *
 * @this {import('./').TestUtils}
 * @param {string} slug Theme slug.
 */
export async function activateTheme( slug ) {
	await this.switchUserToAdmin();
	await this.visitAdminPage( 'themes.php' );

	const activateButton = await this.page.$(
		`div[data-slug="${ slug }"] .button.activate`
	);
	if ( ! activateButton ) {
		this.switchUserToTest();
		return;
	}

	await this.page.click( `div[data-slug="${ slug }"] .button.activate` );
	await this.page.waitForSelector( `div[data-slug="${ slug }"].active` );
	await this.switchUserToTest();
}
