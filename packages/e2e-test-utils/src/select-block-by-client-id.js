/**
 * Given the clientId of a block, selects the block on the editor.
 *
 * @param {string} clientId Identified of the block.
 */
export async function selectBlockByClientId(clientId) {
	await page.evaluate((id) => {
		wp.data.dispatch('core/block-editor').selectBlock(id);
	}, clientId);
}
