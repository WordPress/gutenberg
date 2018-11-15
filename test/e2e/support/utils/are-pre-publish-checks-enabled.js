export async function arePrePublishChecksEnabled() {
	return page.evaluate( () =>
		window.wp.data.select( 'core/editor' ).isPublishSidebarEnabled()
	);
}
