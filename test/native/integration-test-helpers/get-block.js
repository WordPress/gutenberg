/**
 * External dependencies
 */
import { within } from '@testing-library/react-native';

/**
 * Gets a block from the root block list.
 *
 * @param {import('@testing-library/react-native').RenderAPI} screen              A Testing Library screen.
 * @param {string}                                            blockName           Name of the block.
 * @param {Object}                                            options             Configuration options for getting the block.
 * @param {container}                                         [options.container] Row index of the block.
 * @param {number}                                            [options.rowIndex]  Row index of the block.
 * @return {import('react-test-renderer').ReactTestInstance} Block instance.
 */
export const getBlock = (
	screen,
	blockName,
	{ container, rowIndex = 1 } = {}
) => {
	const { getByA11yLabel } = screen;
	if ( container ) {
		return within( container ).getByA11yLabel(
			new RegExp( `${ blockName } Block\\. Row ${ rowIndex }` )
		);
	}
	return getByA11yLabel(
		new RegExp( `${ blockName } Block\\. Row ${ rowIndex }` )
	);
};
