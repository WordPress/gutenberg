/**
 * Enters the site editor edit mode.
 *
 * @this {import('.').SiteEditor}
 */
export async function enterEditMode() {
	await this.page.click( '.edit-site-site-hub__edit-button' );
}
