/**
 * Toggles the site editor mode.
 *
 * @this {import('.').SiteEditor}
 */
export async function toggleCanvasMode() {
	await this.page.click( '.edit-site-header__toggle' );
}
