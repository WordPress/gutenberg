/**
 * Sets code editor content
 *
 * @param {string} content New code editor content.
 *
 * @return {Promise} Promise resolving with an array containing all blocks in the document.
 */
export async function setPostContent(content) {
	return await page.evaluate((_content) => {
		const { dispatch } = window.wp.data;
		const blocks = wp.blocks.parse(_content);
		dispatch('core/block-editor').resetBlocks(blocks);
	}, content);
}
