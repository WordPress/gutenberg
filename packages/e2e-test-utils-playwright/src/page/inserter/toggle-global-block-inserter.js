/**
 * Toggles the global inserter.
 *
 * @this {import('./').PageUtils}
 */
export async function toggleGlobalBlockInserter() {
	// "Add block" selector is required to make sure performance comparison
	// doesn't fail on older branches where we still had "Add block" as label.
	await this.page.click(
		'.edit-post-header [aria-label="Add block"],' +
			'.edit-site-header [aria-label="Add block"],' +
			'.edit-post-header [aria-label="Toggle block inserter"],' +
			'.edit-site-header [aria-label="Toggle block inserter"],' +
			'.edit-widgets-header [aria-label="Add block"],' +
			'.edit-widgets-header [aria-label="Toggle block inserter"]'
	);
}
