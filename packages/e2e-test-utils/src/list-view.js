async function toggleListView() {
	// selector .edit-post-header-toolbar__list-view-toggle is still required because the performance tests also execute against older versions that still use that selector.
	await page.click(
		'.edit-post-header-toolbar__document-overview-toggle, .edit-post-header-toolbar__list-view-toggle, .edit-site-header-edit-mode__list-view-toggle, .edit-widgets-header-toolbar__list-view-toggle'
	);
}

async function isListViewOpen() {
	return await page.evaluate( () => {
		// selector .edit-post-header-toolbar__list-view-toggle is still required because the performance tests also execute against older versions that still use that selector.
		return !! document.querySelector(
			'.edit-post-header-toolbar__document-overview-toggle.is-pressed, .edit-post-header-toolbar__list-view-toggle.is-pressed, .edit-site-header-edit-mode__list-view-toggle.is-pressed, .edit-widgets-header-toolbar__list-view-toggle.is-pressed'
		);
	} );
}

/**
 * Opens list view
 */
export async function openListView() {
	const isOpen = await isListViewOpen();
	if ( ! isOpen ) {
		await toggleListView();
	}
}

/**
 * Closes list view
 */
export async function closeListView() {
	const isOpen = await isListViewOpen();
	if ( isOpen ) {
		await toggleListView();
	}
}
