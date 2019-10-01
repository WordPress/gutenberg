/**
 * Internal dependencies
 */
import { toggleScreenOption } from './toggle-screen-option';

/**
 * Disables Pre-publish checks.
 */
export async function disablePrePublishChecks() {
	await toggleScreenOption( 'Pre-publish Checks', false );
}
