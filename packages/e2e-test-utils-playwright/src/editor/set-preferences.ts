/**
 * Internal dependencies
 */
import type { Editor } from './index';

type PreferencesContext =
	| 'core/edit-post'
	| 'core/edit-site'
	| 'core/customize-widgets';

interface PreferencesRepresentation {
	welcomeGuide?: boolean;
	fullscreenMode?: boolean;
}

/**
 * Set the preferences of the editor.
 *
 * @param this
 * @param context     Context to set preferences for.
 * @param preferences Preferences to set.
 */
export async function setPreferences(
	this: Editor,
	context: PreferencesContext,
	preferences: PreferencesRepresentation
) {
	await this.page.waitForFunction( () => window?.wp?.data );

	await this.page.evaluate( async ( _preferences ) => {
		for ( const [ key, value ] of Object.entries( _preferences ) ) {
			await window.wp.data
				.dispatch( 'core/preferences' )
				.set( context, key, value );
		}
	}, preferences );
}
