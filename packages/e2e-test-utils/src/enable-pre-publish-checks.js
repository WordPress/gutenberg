/**
 * Internal dependencies
 */
import { toggleScreenOption } from './toggle-screen-option';
import { toggleMoreMenu } from './toggle-more-menu';

/**
 * Enables Pre-publish checks.
 */
export async function enablePrePublishChecks() {
	await toggleScreenOption( 'Pre-publish checklist', true );
	await toggleMoreMenu();
}
