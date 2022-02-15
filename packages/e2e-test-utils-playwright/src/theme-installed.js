/**
 * Checks whether a theme exists on the site.
 *
 * @this {import('./').TestUtils}
 *
 * @param {string} slug Theme slug to check.
 * @return {boolean} Whether the theme exists.
 */
export async function isThemeInstalled( slug ) {
	await this.switchUserToAdmin();
	await this.visitAdminPage( 'themes.php' );

	const found = await this.page
		.locator( `[data-slug=${ slug }]` )
		.isVisible();

	await this.switchUserToTest();

	return Boolean( found );
}
