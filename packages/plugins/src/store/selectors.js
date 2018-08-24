/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Returns true if the plugin item is pinned.
 * When the value is not set it defaults to true.
 *
 * @param  {Object}  state    Global application state.
 * @param  {string}  itemName Item name.
 *
 * @return {boolean} Whether the plugin item is pinned.
 */
export function isPluginItemPinned( state, itemName ) {
	return get( state, [ 'preferences', 'pinnedPluginItems', itemName ], true );
}
