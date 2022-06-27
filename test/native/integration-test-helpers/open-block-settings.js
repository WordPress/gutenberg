/**
 * External dependencies
 */
import { fireEvent } from '@testing-library/react-native';

/**
 * Internal dependencies
 */
import { waitForModalVisible } from './wait-for-modal-visible';

/**
 * Opens the block settings of the current selected block.
 *
 * @param {import('@testing-library/react-native').RenderAPI} screen The Testing Library screen.
 */
export const openBlockSettings = async ( screen ) => {
	const { getByA11yLabel, getByTestId } = screen;
	fireEvent.press( getByA11yLabel( 'Open Settings' ) );
	return waitForModalVisible( getByTestId( 'block-settings-modal' ) );
};
