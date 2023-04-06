/**
 * External dependencies
 */
import { fireEvent, within } from '@testing-library/react-native';

/**
 * Internal dependencies
 */
import { getBlock } from './get-block';
import { openBlockActionsMenu } from './open-block-actions-menu';

/**
 * Transforms the selected block to a specified block.
 *
 * @param {import('@testing-library/react-native').RenderAPI} screen              A Testing Library screen.
 * @param {string}                                            blockName           Name of the block.
 * @param {Object}                                            [options]           Configuration options.
 * @param {number}                                            [options.canUnwrap] True if the block can be unwrapped.
 * @return {[import('react-test-renderer').ReactTestInstance]} Block transform options.
 */
export const getBlockTransformOptions = async (
	screen,
	blockName,
	{ canUnwrap = false } = {}
) => {
	const { getByTestId, getByText } = screen;

	fireEvent.press( getBlock( screen, blockName ) );
	await openBlockActionsMenu( screen );
	fireEvent.press( getByText( 'Transform block…' ) );

	let blockTransformButtons = within(
		getByTestId( 'block-transformations-menu' )
	).getAllByRole( 'button' );

	// Remove Unwrap option as it's not a direct block transformation.
	if ( canUnwrap ) {
		const unwrapButton = within(
			getByTestId( 'block-transformations-menu' )
		).getByLabelText( 'Unwrap' );
		blockTransformButtons = blockTransformButtons.filter(
			( button ) => button !== unwrapButton
		);
	}

	return blockTransformButtons;
};
