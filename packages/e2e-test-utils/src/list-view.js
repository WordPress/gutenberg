async function toggleListView() {
	await page.click(
		'.edit-post-header-toolbar__list-view-toggle, .edit-site-header-toolbar__list-view-toggle, .edit-widgets-header-toolbar__list-view-toggle'
	);
}

async function isListViewOpen() {
	return await page.evaluate( () => {
		return !! document.querySelector(
			'.edit-post-header-toolbar__list-view-toggle.is-pressed, .edit-site-header-toolbar__list-view-toggle.is-pressed, .edit-widgets-header-toolbar__list-view-toggle.is-pressed'
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
