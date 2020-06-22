/**
 * Internal dependencies
 */
import { toggleScreenOption } from './toggle-screen-option';
import { toggleMoreMenu } from './toggle-more-menu';

/**
 * Disables Pre-publish checks.
 */
export async function disablePrePublishChecks() {
	await toggleScreenOption( 'Pre-publish checks', false );
	await toggleMoreMenu();
}
