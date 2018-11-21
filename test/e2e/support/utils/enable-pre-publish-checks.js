/**
 * Internal dependencies
 */
import { toggleOption } from './toggle-option';

/**
 * Enable Pre-publish checks
 */
export async function enablePrePublishChecks() {
	await toggleOption( 'Enable Pre-publish Checks', true );
}
