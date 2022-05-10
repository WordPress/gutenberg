/**
 * Checks if the block that is focused is the default block.
 *
 * @return {Promise} Promise resolving with a boolean indicating if the focused block is the default block.
 */
export function isInDefaultBlock() {
	return page.evaluate( () => {
		const activeElement = document.activeElement;
		// activeElement may be null in that case we should return false.
		if ( ! activeElement ) {
			return false;
		}
		const closestElementWithDataTpe = activeElement.closest(
			'[data-type]'
		);
		if ( ! closestElementWithDataTpe ) {
			return false;
		}
		const activeBlockName = closestElementWithDataTpe.getAttribute(
			'data-type'
		);
		const defaultBlockName = window.wp.blocks.getDefaultBlockName();

		return activeBlockName === defaultBlockName;
	} );
}
