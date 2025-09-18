/**
 * External dependencies
 */
import { fireEvent } from '@testing-library/react-native';

/**
 * Dismisses a modal.
 *
 * @param {ReturnType<import('@testing-library/react-native').RenderAPI['getByTestId']>} modalInstance Modal test instance.
 */
export const dismissModal = async ( modalInstance ) =>
	fireEvent( modalInstance, 'backdropPress' );
