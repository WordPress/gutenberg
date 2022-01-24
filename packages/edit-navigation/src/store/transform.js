/**
 * External dependencies
 */
import { get, omit, sortBy, zip } from 'lodash';

/**
 * WordPress dependencies
 */
import { serialize, createBlock, parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { NEW_TAB_TARGET_ATTRIBUTE } from '../constants';
import {
	addRecordIdToBlock,
	getRecordIdFromBlock,
	isBlockSupportedInNav,
} from './utils';

/**
 * A WP nav_menu_item object.
 * For more documentation on the individual fields present on a menu item please see:
 * https://core.trac.wordpress.org/browser/tags/5.7.1/src/wp-includes/nav-menu.php#L789
 *
 * Changes made here should also be mirrored in packages/edit-navigation/src/store/utils.js.
 *
 * @typedef WPNavMenuItem
 *
 * @property {Object} title       stores the raw and rendered versions of the title/label for this menu item.
 * @property {Array}  xfn         the XFN relationships expressed in the link of this menu item.
 * @property {Array}  classes     the HTML class attributes for this menu item.
 * @property {string} attr_title  the HTML title attribute for this menu item.
 * @property {string} object      The type of object originally represented, such as 'category', 'post', or 'attachment'.
 * @property {string} object_id   The DB ID of the original object this menu item represents, e.g. ID for posts and term_id for categories.
 * @property {string} description The description of this menu item.
 * @property {string} url         The URL to which this menu item points.
 * @property {string} type        The family of objects originally represented, such as 'post_type' or 'taxonomy'.
 * @property {string} target      The target attribute of the link element for this menu item.
 */

export function blockToMenuItem(
	block,
	menuItem,
	parentId,
	blockPosition,
	menuId
) {
	menuItem = omit( menuItem, 'menus', 'meta', '_links' );
	menuItem.content = get( menuItem.content, 'raw', menuItem.content );

	let attributes;

	if ( isBlockSupportedInNav( block ) ) {
		attributes = blockAttributesToMenuItem( block.attributes );
	} else {
		attributes = {
			type: 'block',
			content: serialize( block ),
		};
	}

	return {
		...menuItem,
		...attributes,
		content: attributes.content || '',
		id: getRecordIdFromBlock( block ),
		menu_order: blockPosition + 1,
		menus: menuId,
		parent: ! parentId ? 0 : parentId,
		status: 'publish',
	};
}

/**
 * Convert block attributes to menu item fields.
 *
 * Note that nav_menu_item has defaults provided in Core so in the case of undefined Block attributes
 * we need only include a subset of values in the knowledge that the defaults will be provided in Core.
 *
 * See: https://core.trac.wordpress.org/browser/tags/5.7.1/src/wp-includes/nav-menu.php#L438.
 *
 * @param {Object}  blockAttributes               the block attributes of the block to be converted into menu item fields.
 * @param {string}  blockAttributes.label         the visual name of the block shown in the UI.
 * @param {string}  blockAttributes.url           the URL for the link.
 * @param {string}  blockAttributes.description   a link description.
 * @param {string}  blockAttributes.rel           the XFN relationship expressed in the link of this menu item.
 * @param {string}  blockAttributes.className     the custom CSS classname attributes for this block.
 * @param {string}  blockAttributes.title         the HTML title attribute for the block's link.
 * @param {string}  blockAttributes.type          the type of variation of the block used (eg: 'Post', 'Custom', 'Category'...etc).
 * @param {number}  blockAttributes.id            the ID of the entity optionally associated with the block's link (eg: the Post ID).
 * @param {string}  blockAttributes.kind          the family of objects originally represented, such as 'post-type' or 'taxonomy'.
 * @param {boolean} blockAttributes.opensInNewTab whether or not the block's link should open in a new tab.
 * @return {WPNavMenuItem} the menu item (converted from block attributes).
 */
export const blockAttributesToMenuItem = ( {
	label = '',
	url = '',
	description,
	rel,
	className,
	title: blockTitleAttr,
	type,
	id,
	kind,
	opensInNewTab,
} ) => {
	// For historical reasons, the `core/navigation-link` variation type is `tag`
	// whereas WP Core expects `post_tag` as the `object` type.
	// To avoid writing a block migration we perform a conversion here.
	// See also inverse equivalent in `menuItemToBlockAttributes`.
	if ( type && type === 'tag' ) {
		type = 'post_tag';
	}

	return {
		title: label,
		url,
		...( description?.length && {
			description,
		} ),
		...( rel?.length && {
			xfn: rel?.trim().split( ' ' ),
		} ),
		...( className?.length && {
			classes: className?.trim().split( ' ' ),
		} ),
		...( blockTitleAttr?.length && {
			attr_title: blockTitleAttr,
		} ),
		...( type?.length && {
			object: type,
		} ),
		...( kind?.length && {
			type: kind?.replace( '-', '_' ),
		} ),
		// Only assign object_id if it's a entity type (ie: not "custom").
		...( id &&
			'custom' !== type && {
				object_id: id,
			} ),
		target: opensInNewTab ? NEW_TAB_TARGET_ATTRIBUTE : '',
	};
};

/**
 * Convert a flat menu item structure to a nested blocks structure.
 *
 * @param {Object[]} menuItems An array of menu items.
 *
 * @return {WPBlock[]} An array of blocks.
 */
export function menuItemsToBlocks( menuItems ) {
	if ( ! menuItems ) {
		return null;
	}

	const menuTree = createDataTree( menuItems );

	return mapMenuItemsToBlocks( menuTree );
}

/**
 * A recursive function that maps menu item nodes to blocks.
 *
 * @param {WPNavMenuItem[]} menuItems An array of WPNavMenuItem items.
 * @return {Object} Object containing innerBlocks and mapping.
 */
function mapMenuItemsToBlocks( menuItems ) {
	// The menuItem should be in menu_order sort order.
	const sortedItems = sortBy( menuItems, 'menu_order' );

	const blocks = sortedItems.map( ( menuItem ) => {
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

		// If there are children recurse to build those nested blocks.
		const nestedBlocks = menuItem.children?.length
			? mapMenuItemsToBlocks( menuItem.children )
			: [];

		// Create a submenu block when there are inner blocks, or just a link
		// for a standalone item.
		const itemBlockName = nestedBlocks?.length
			? 'core/navigation-submenu'
			: 'core/navigation-link';

		// Create block with nested "innerBlocks".
		return createBlock( itemBlockName, attributes, nestedBlocks );
	} );

	return zip( blocks, sortedItems ).map( ( [ block, menuItem ] ) =>
		addRecordIdToBlock( block, menuItem.id )
	);
}

// A few parameters are using snake case, let's embrace that for convenience:
/* eslint-disable camelcase */
/**
 * Convert block attributes to menu item.
 *
 * @param {WPNavMenuItem} menuItem the menu item to be converted to block attributes.
 * @return {Object} the block attributes converted from the WPNavMenuItem item.
 */
export function menuItemToBlockAttributes( {
	title: menuItemTitleField,
	xfn,
	classes,
	attr_title,
	object,
	object_id,
	description,
	url,
	type: menuItemTypeField,
	target,
} ) {
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
		...( object_id &&
			'custom' !== object && {
				id: object_id,
			} ),
		...( description?.length && {
			description,
		} ),
		...( target === NEW_TAB_TARGET_ATTRIBUTE && {
			opensInNewTab: true,
		} ),
	};
}
/* eslint-enable camelcase */

/**
 * Creates a nested, hierarchical tree representation from unstructured data that
 * has an inherent relationship defined between individual items.
 *
 * For example, by default, each element in the dataset should have an `id` and
 * `parent` property where the `parent` property indicates a relationship between
 * the current item and another item with a matching `id` properties.
 *
 * This is useful for building linked lists of data from flat data structures.
 *
 * @param {Array}  dataset  linked data to be rearranged into a hierarchical tree based on relational fields.
 * @param {string} id       the property which uniquely identifies each entry within the array.
 * @param {*}      relation the property which identifies how the current item is related to other items in the data (if at all).
 * @return {Array} a nested array of parent/child relationships
 */
function createDataTree( dataset, id = 'id', relation = 'parent' ) {
	const hashTable = Object.create( null );
	const dataTree = [];

	for ( const data of dataset ) {
		hashTable[ data[ id ] ] = {
			...data,
			children: [],
		};
	}
	for ( const data of dataset ) {
		if ( data[ relation ] ) {
			hashTable[ data[ relation ] ] = hashTable[ data[ relation ] ] || {};
			hashTable[ data[ relation ] ].children =
				hashTable[ data[ relation ] ].children || [];
			hashTable[ data[ relation ] ].children.push(
				hashTable[ data[ id ] ]
			);
		} else {
			dataTree.push( hashTable[ data[ id ] ] );
		}
	}

	return dataTree;
}
