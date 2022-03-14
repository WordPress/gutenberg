/**
 * Checks if the blocks inserter is open.
 *
 * @this {import('./').PageUtils}
 */
export async function isGlobalInserterOpen() {
	return await this.page.evaluate( () => {
		// "Add block" selector is required to make sure performance comparison
		// doesn't fail on older branches where we still had "Add block" as label.
		return !! document.querySelector(
			'.edit-post-header [aria-label="Add block"].is-pressed,' +
				'.edit-site-header [aria-label="Add block"].is-pressed,' +
				'.edit-post-header [aria-label="Toggle block inserter"].is-pressed,' +
				'.edit-site-header [aria-label="Toggle block inserter"].is-pressed,' +
				'.edit-widgets-header [aria-label="Toggle block inserter"].is-pressed,' +
				'.edit-widgets-header [aria-label="Add block"].is-pressed'
		);
	} );
}
