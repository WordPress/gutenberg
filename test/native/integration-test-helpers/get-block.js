/**
 * Gets a block from the root block list.
 *
 * @param {import('@testing-library/react-native').RenderAPI} screen             A Testing Library screen.
 * @param {string}                                            blockName          Name of the block.
 * @param {Object}                                            options            Configuration options for getting the block.
 * @param {number}                                            [options.rowIndex] Row index of the block.
 * @return {import('react-test-renderer').ReactTestInstance} Block instance.
 */
export const getBlock = ( screen, blockName, { rowIndex = 1 } = {} ) => {
	const { getByA11yLabel } = screen;
	return getByA11yLabel(
		new RegExp( `${ blockName } Block\\. Row ${ rowIndex }` )
	);
};
