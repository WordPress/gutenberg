/**
 * Returns a boolean indicating if the current selected block has a block switcher or not.
 *
 * @return {Promise} Promise resolving with a boolean.
 */
export const hasBlockSwitcher = async () => {
	return page.evaluate( ( blockSwitcherSelector ) => {
		return !! document.querySelector( blockSwitcherSelector );
	}, '.editor-block-toolbar .editor-block-switcher' );
};
