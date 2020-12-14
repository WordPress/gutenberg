/**
 * Internal dependencies
 */
import { canvas } from './canvas';

/**
 * Checks if the block that is focused is the default block.
 *
 * @return {Promise} Promise resolving with a boolean indicating if the focused block is the default block.
 */
export async function isInDefaultBlock() {
	const defaultBlockName = await page.evaluate( () =>
		window.wp.blocks.getDefaultBlockName()
	);
	const activeBlockName = await canvas().evaluate( () => {
		const { activeElement } = document;
		// activeElement may be null in that case we should return false
		if ( ! activeElement ) {
			return false;
		}
		const closestElementWithDataType = activeElement.closest(
			'[data-type]'
		);
		if ( ! closestElementWithDataType ) {
			return false;
		}
		return closestElementWithDataType.getAttribute( 'data-type' );
	} );
	return defaultBlockName === activeBlockName;
}
