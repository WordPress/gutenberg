/**
 * Verify if publish checks are enabled.
 */
export async function arePrePublishChecksEnabled() {
	await page.evaluate( () => window.wp.data.select( 'core/editor' ).isPublishSidebarEnabled() );
}
