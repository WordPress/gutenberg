/**
 * Returns a boolean indicating if the current selected block has a block switcher or not.
 *
 * @return {Promise} Promise resolving with a boolean.
 */
export const hasBlockSwitcher = async () => {
	return page.evaluate((blockSwitcherSelector) => {
		return !!document.querySelector(blockSwitcherSelector);
	}, '.block-editor-block-toolbar .block-editor-block-switcher');
};
