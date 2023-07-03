/**
 * External dependencies
 */
import { fireEvent } from '@testing-library/react-native';

/**
 * Dismisses a modal.
 *
 * @param {import('react-test-renderer').ReactTestInstance} modalInstance Modal test instance.
 */
export const dismissModal = async ( modalInstance ) =>
	fireEvent( modalInstance, 'backdropPress' );
