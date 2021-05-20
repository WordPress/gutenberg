/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as interfaceStore } from '../store';

/**
 * Set the default values for feature preferences.
 *
 * @param {string}                 scope    The scope (e.g. core/edit-post)
 * @param {Object<string,boolean>} defaults A map of feature names to their default value
 */
export function setFeatureDefaults( scope, defaults ) {
	dispatch( interfaceStore ).setFeatureDefaults( scope, defaults );
}
