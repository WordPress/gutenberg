/**
 * Internal dependencies
 */
import { toggleOption } from './toggle-option';

/**
 * Disables Pre-publish checks.
 */
export async function disablePrePublishChecks() {
	await toggleOption( 'Enable Pre-publish Checks', false );
}
