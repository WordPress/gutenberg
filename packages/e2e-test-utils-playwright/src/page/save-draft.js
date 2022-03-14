/**
 * Saves the post as a draft, resolving once the request is complete (once the
 * "Saved" indicator is displayed).
 *
 * @this {import('./').PageUtils}
 * @return {Promise} Promise resolving when draft save is complete.
 */
export async function saveDraft() {
	await this.page.waitForSelector( '.editor-post-save-draft' );
	await this.page.click( '.editor-post-save-draft' );
	return this.page.waitForSelector( '.editor-post-saved-state.is-saved' );
}
