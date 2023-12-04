/**
 * Internal dependencies
 */
import { togglePreferencesOption } from './toggle-preferences-option';
import { toggleMoreMenu } from './toggle-more-menu';

/**
 * Disables Pre-publish checks.
 */
export async function disablePrePublishChecks() {
	await togglePreferencesOption(
		'General',
		'Enable pre-publish flow',
		false
	);
	await toggleMoreMenu( 'close' );
}
