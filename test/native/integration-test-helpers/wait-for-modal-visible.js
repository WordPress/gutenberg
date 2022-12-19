/**
 * Internal dependencies
 */
import { waitFor } from './wait-for';

/**
 * Waits for a modal to be visible.
 *
 * @param {import('react-test-renderer').ReactTestInstance} modalInstance Modal test instance.
 */
export const waitForModalVisible = async ( modalInstance ) => {
	return waitFor( () => modalInstance.props.isVisible );
};
