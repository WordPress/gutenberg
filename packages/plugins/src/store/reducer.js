/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS } from './defaults';

/**
 * Reducer returning the user preferences.
 *
 * @param {Object}  state                   Current state.
 * @param {Object}  state.pinnedPluginItems The state of the different pinned plugin items.
 * @param {Object}  action                  Dispatched action.
 *
 * @return {Object} Updated state.
 */
export const preferences = combineReducers( {
	pinnedPluginItems( state = PREFERENCES_DEFAULTS.pinnedPluginItems, action ) {
		if ( action.type === 'TOGGLE_PINNED_PLUGIN_ITEM' ) {
			return {
				...state,
				[ action.itemName ]: ! get( state, [ action.itemName ], true ),
			};
		}
		return state;
	},
} );

export default combineReducers( {
	preferences,
} );
