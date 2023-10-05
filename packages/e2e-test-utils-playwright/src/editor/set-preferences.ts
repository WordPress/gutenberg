/**
 * Internal dependencies
 */
import type { Editor } from './index';

interface PreferencesRepresentation {
	welcomeGuide?: boolean;
	fullscreenMode?: boolean;
}

/**
 * Set the preferences of the editor.
 *
 * @param this
 * @param preferences Preferences to set.
 */
export async function setPreferences(
	this: Editor,
	preferences: PreferencesRepresentation
) {
	await this.page.waitForFunction( () => window?.wp?.data );

	await this.page.evaluate( async ( _preferences ) => {
		for ( const [ key, value ] of Object.entries( _preferences ) ) {
			await window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', key, value );
		}
	}, preferences );
}
