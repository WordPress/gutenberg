/**
 * WordPress dependencies
 */
import { createBlock, parse } from '@wordpress/blocks';

/**
 * A WP nav_menu_item object.
 * For more documentation on the individual fields present on a menu item please see:
 * https://core.trac.wordpress.org/browser/tags/5.7.1/src/wp-includes/nav-menu.php#L789
 *
 * Changes made here should also be mirrored in packages/edit-navigation/src/store/utils.js.
 *
 * @typedef WPNavMenuItem
 *
 * @property {Object} title stores the raw and rendered versions of the title/label for this menu item.
 * @property {Array} xfn the XFN relationships expressed in the link of this menu item.
 * @property {Array} classes the HTML class attributes for this menu item.
 * @property {string} attr_title the HTML title attribute for this menu item.
 * @property {string} object The type of object originally represented, such as 'category', 'post', or 'attachment'.
 * @property {string} object_id The DB ID of the original object this menu item represents, e.g. ID for posts and term_id for categories.
 * @property {string} description The description of this menu item.
 * @property {string} url The URL to which this menu item points.
 * @property {string} type The family of objects originally represented, such as 'post_type' or 'taxonomy'.
 * @property {string} target The target attribute of the link element for this menu item.
 */

/**
 * Convert block attributes to menu item.
 *
 * @param {WPNavMenuItem} menuItem the menu item to be converted to block attributes.
 * @return {Object} the block attributes converted from the WPNavMenuItem item.
 */
export const menuItemToBlockAttributes = ( {
	title: menuItemTitleField,
	xfn,
	classes,
	// eslint-disable-next-line camelcase
	attr_title,
	object,
	// eslint-disable-next-line camelcase
	object_id,
	description,
	url,
	type: menuItemTypeField,
	target,
} ) => {
	// For historical reasons, the `core/navigation-link` variation type is `tag`
	// whereas WP Core expects `post_tag` as the `object` type.
	// To avoid writing a block migration we perform a conversion here.
	// See also inverse equivalent in `blockAttributesToMenuItem`.
	if ( object && object === 'post_tag' ) {
		object = 'tag';
	}

	return {
		label: menuItemTitleField?.rendered || '',
		...( object?.length && {
			type: object,
		} ),
		kind: menuItemTypeField?.replace( '_', '-' ) || 'custom',
		url: url || '',
		...( xfn?.length &&
			xfn.join( ' ' ).trim() && {
				rel: xfn.join( ' ' ).trim(),
			} ),
		...( classes?.length &&
			classes.join( ' ' ).trim() && {
				className: classes.join( ' ' ).trim(),
			} ),
		...( attr_title?.length && {
			title: attr_title,
		} ),
		// eslint-disable-next-line camelcase
		...( object_id &&
			'custom' !== object && {
				id: object_id,
			} ),
		...( description?.length && {
			description,
		} ),
		...( target === '_blank' && {
			opensInNewTab: true,
		} ),
	};
};

/**
 * A recursive function that maps menu item nodes to blocks.
 *
 * @param {Object[]} menuItems An array of menu items.
 * @return {WPBlock[]} An array of blocks.
 */
export default function mapMenuItemsToBlocks( menuItems ) {
	return menuItems.map( ( menuItem ) => {
		if ( menuItem.type === 'block' ) {
			const [ block ] = parse( menuItem.content.raw );

			if ( ! block ) {
				return createBlock( 'core/freeform', {
					content: menuItem.content,
				} );
			}

			return block;
		}

		const attributes = menuItemToBlockAttributes( menuItem );

		const innerBlocks = menuItem.children?.length
			? mapMenuItemsToBlocks( menuItem.children )
			: [];

		return createBlock( 'core/navigation-link', attributes, innerBlocks );
	} );
}
