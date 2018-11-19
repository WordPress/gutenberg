/**
 * Internal dependencies
 */
import { toggleOption } from './toggle-option';

export async function enablePrePublishChecks() {
	await toggleOption( 'Enable Pre-publish Checks', true );
}
