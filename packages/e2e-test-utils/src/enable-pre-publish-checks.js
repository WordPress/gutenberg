/**
 * Internal dependencies
 */
import { toggleScreenOption } from './toggle-screen-option';

/**
 * Enables Pre-publish checks.
 */
export async function enablePrePublishChecks() {
	await toggleScreenOption( 'Enable Pre-publish Checks', true );
}
