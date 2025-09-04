/**
 * External dependencies
 */
import { within } from '@testing-library/react-native';

/**
 * Gets an inner block from another block.
 *
 * @param {ReturnType<import('@testing-library/react-native').RenderAPI['getByTestId']>} parentBlock        Parent block from where to get the block.
 * @param {string}                                                                       blockName          Name of the block.
 * @param {Object}                                                                       options            Configuration options for getting the block.
 * @param {number}                                                                       [options.rowIndex] Row index of the block.
 * @return {ReturnType<import('@testing-library/react-native').RenderAPI['getByTestId']>} Block instance.
 */
export const getInnerBlock = (
	parentBlock,
	blockName,
	{ rowIndex = 1 } = {}
) => {
	return within( parentBlock ).getAllByLabelText(
		new RegExp( `${ blockName } Block\\. Row ${ rowIndex }` )
	)[ 0 ];
};
