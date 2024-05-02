/**
 * External dependencies
 */
import { waitFor } from '@testing-library/react-native';

/**
 * Waits for a modal to be visible.
 *
 * @param {HTMLElement} modalInstance Modal test instance.
 */
export const waitForModalVisible = async ( modalInstance ) => {
	return waitFor( () =>
		expect( modalInstance.props.isVisible ).toBe( true )
	);
};
