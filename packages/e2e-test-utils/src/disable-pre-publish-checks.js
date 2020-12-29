/**
 * Internal dependencies
 */
import { toggleScreenOption } from './toggle-screen-option';
import { toggleMoreMenu } from './toggle-more-menu';

/**
 * Disables Pre-publish checks.
 */
export async function disablePrePublishChecks() {
	await toggleScreenOption( 'Include pre-publish checklist', false );
	await toggleMoreMenu();
}
