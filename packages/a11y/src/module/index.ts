/**
 * Internal dependencies
 */
import { makeSetupFunction } from '../shared/index';
export { speak } from '../shared/index';

// Without an i18n script-module, "Notifications" (the only localized text used in this module)
// will be trasnlated on the server and provided as script-module data.
let notificationsText = 'Notifications';
try {
	const textContent = document.getElementById(
		'wp-script-module-data-@wordpress/a11y'
	)?.textContent;
	if ( textContent ) {
		const parsed = JSON.parse( textContent );
		notificationsText = parsed?.i18n?.Notifications ?? notificationsText;
	}
} catch {}

/**
 * Create the live regions.
 */
export const setup = makeSetupFunction( notificationsText );

setup();
