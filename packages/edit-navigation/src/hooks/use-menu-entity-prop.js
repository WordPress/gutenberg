/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { MENU_KIND, MENU_POST_TYPE } from '../constants';

/**
 * Returns the value and setter for the specified
 * property of the menu.
 *
 * @param {string} prop   A Property name.
 * @param {string} menuId A menu ID.
 *
 * @return {[*, Function]} A tuple where the first item is the
 *                         property value and the second is the
 *                         setter.
 */
export default function useMenuEntityProp( prop, menuId ) {
	return useEntityProp( MENU_KIND, MENU_POST_TYPE, prop, menuId );
}
