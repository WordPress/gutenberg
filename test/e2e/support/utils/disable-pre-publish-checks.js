/**
 * Internal dependencies
 */
import { toggleOption } from './toggle-option';

export async function disablePrePublishChecks() {
	await toggleOption( 'Enable Pre-publish Checks', false );
}
