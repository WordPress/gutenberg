/**
 * External dependencies
 */
import { fireEvent } from '@testing-library/react-native';

/**
 * Dismisses a modal.
 *
 * @param {HTMLElement} modalInstance Modal test instance.
 */
export const dismissModal = async ( modalInstance ) =>
	fireEvent( modalInstance, 'backdropPress' );
