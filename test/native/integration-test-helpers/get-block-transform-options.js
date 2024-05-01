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
 * @param {import('@testing-library/react-native').RenderAPI} screen    A Testing Library screen.
 * @param {string}                                            blockName Name of the block.
 * @return {[HTMLElement]} Block transform options.
 */
export const getBlockTransformOptions = async ( screen, blockName ) => {
	const { getByTestId, getByText } = screen;

	fireEvent.press( getBlock( screen, blockName ) );
	await openBlockActionsMenu( screen );
	fireEvent.press( getByText( 'Transform block…' ) );

	return within( getByTestId( 'block-transformations-menu' ) ).getAllByRole(
		'button'
	);
};
