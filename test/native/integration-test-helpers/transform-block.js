/**
 * External dependencies
 */
import { act, fireEvent } from '@testing-library/react-native';

/**
 * Internal dependencies
 */
import { getBlock } from './get-block';
import { openBlockActionsMenu } from './open-block-actions-menu';
import { triggerBlockListLayout } from './trigger-block-list-layout';

const apiFetchPromise = Promise.resolve( {} );

/**
 * Transforms the selected block to a specified block.
 *
 * @param {import('@testing-library/react-native').RenderAPI} screen                   A Testing Library screen.
 * @param {string}                                            blockName                Name of the block to transform.
 * @param {string}                                            targetBlockName          Name of the target block to transform to.
 * @param {Object}                                            [options]                Configuration options for the transformation.
 * @param {number}                                            [options.isMediaBlock]   True if the block transformation will result in a media block.
 * @param {number}                                            [options.hasInnerBlocks] True if the block transformation will result in a block that contains inner blocks.
 * @return {import('react-test-renderer').ReactTestInstance} Block instance after the block transformation result.
 */
export const transformBlock = async (
	screen,
	blockName,
	targetBlockName,
	{ isMediaBlock = false, hasInnerBlocks = false } = {}
) => {
	const { getByText } = screen;

	fireEvent.press( getBlock( screen, blockName ) );

	await openBlockActionsMenu( screen );
	fireEvent.press( getByText( 'Transform block…' ) );
	fireEvent.press( getByText( targetBlockName ) );

	// For media blocks, we must wait for the media fetch via `getMedia`.
	if ( isMediaBlock ) {
		await act( () => apiFetchPromise );
	}

	const newBlock = getBlock( screen, targetBlockName );
	// For blocks that contain inner blocks, we must trigger the inner
	// block list layout to render its content.
	if ( hasInnerBlocks ) {
		await triggerBlockListLayout( newBlock );
	}
	return newBlock;
};
