/**
 * WordPress dependencies
 */
import { createBlock, parse } from '@wordpress/blocks';

/**
 * Convert block attributes to menu item.
 *
 * For more documentation on the individual fields present on a menu item please see:
 * https://core.trac.wordpress.org/browser/tags/5.7.1/src/wp-includes/nav-menu.php#L789
 *
 * @param {Object} menuItem the menu item to be converted to block attributes.
 * @param {Object} menuItem.title stores the raw and rendered versions of the title/label for this menu item.
 * @param {Array} menuItem.xfn the XFN relationships expressed in the link of this menu item.
 * @param {Array} menuItem.classes the HTML class attributes for this menu item.
 * @param {string} menuItem.attr_title the HTML title attribute for this menu item.
 * @param {string} menuItem.object The type of object originally represented, such as 'category', 'post', or 'attachment'.
 * @param {string} menuItem.object_id The DB ID of the original object this menu item represents, e.g. ID for posts and term_id for categories.
 * @param {string} menuItem.description The description of this menu item.
 * @param {string} menuItem.url The URL to which this menu item points.
 * @param {string} menuItem.type The family of objects originally represented, such as 'post_type' or 'taxonomy'.
 * @param {string} menuItem.target The target attribute of the link element for this menu item.
 * @return {Object} the block attributes converted from the menu item.
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
	return {
		label: menuItemTitleField?.rendered || '',
		type: object || 'custom',
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
