/**
 * External dependencies
 */
import { fireEvent } from '@testing-library/react-native';

/**
 * Internal dependencies
 */
import { waitForModalVisible } from './wait-for-modal-visible';

/**
 * Opens the block's actions menu of the current selected block.
 *
 * @param {import('@testing-library/react-native').RenderAPI} screen The Testing Library screen.
 */
export const openBlockActionsMenu = async ( screen ) => {
	const { getByLabelText, getByTestId } = screen;
	fireEvent.press( getByLabelText( 'Open Block Actions Menu' ) );
	return waitForModalVisible( getByTestId( 'block-actions-menu' ) );
};
