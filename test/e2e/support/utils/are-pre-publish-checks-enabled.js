/**
 * Verifies if publish checks are enabled.
 * @return {boolean} Boolean which represents the state of prepublish checks.
 */
export async function arePrePublishChecksEnabled() {
	return page.evaluate( () =>
		window.wp.data.select( 'core/editor' ).isPublishSidebarEnabled()
	);
}
