/**
 * Internal dependencies
 */
import { togglePreferencesOption } from './toggle-preferences-option';
import { toggleMoreMenu } from './toggle-more-menu';

/**
 * Enables Pre-publish checks.
 */
export async function enablePrePublishChecks() {
	await togglePreferencesOption(
		'General',
		'Enable pre-publish checks',
		true
	);
	await toggleMoreMenu( 'close' );
}
