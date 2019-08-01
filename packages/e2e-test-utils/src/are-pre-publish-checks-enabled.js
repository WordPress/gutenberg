/**
 * Internal dependencies
 */
import { wpDataSelect } from './wp-data-select';

/**
 * Verifies if publish checks are enabled.
 * @return {boolean} Boolean which represents the state of prepublish checks.
 */
export function arePrePublishChecksEnabled() {
	return wpDataSelect( 'core/editor', 'isPublishSidebarEnabled' );
}
