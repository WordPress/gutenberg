/**
 * Internal dependencies
 */
import { toggleScreenOption } from './toggle-screen-option';

/**
 * Enables Pre-publish checks.
 */
export async function enablePrePublishChecks() {
	await toggleScreenOption( 'Pre-publish Checks', true );
}
