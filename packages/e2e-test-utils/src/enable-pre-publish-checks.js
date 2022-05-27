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
		'Include pre-publish checklist',
		true
	);
	await toggleMoreMenu( 'close' );
}
