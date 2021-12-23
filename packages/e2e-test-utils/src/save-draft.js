/**
 * Saves the post as a draft, resolving once the request is complete (once the
 * "Saved" indicator is displayed).
 *
 * @return {Promise} Promise resolving when draft save is complete.
 */
export async function saveDraft() {
	await page.waitForSelector('.editor-post-save-draft');
	await page.click('.editor-post-save-draft');
	return page.waitForSelector('.editor-post-saved-state.is-saved');
}
