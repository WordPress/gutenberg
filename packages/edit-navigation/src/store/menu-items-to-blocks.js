/**
 * External dependencies
 */
import { sortBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock, parse } from '@wordpress/blocks';

/**
 * Convert a flat menu item structure to a nested blocks structure.
 *
 * @param {Object[]} menuItems An array of menu items.
 *
 * @return {WPBlock[]} An array of blocks.
 */
export default function menuItemsToBlocks( menuItems ) {
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
	let mapping = {};

	// The menuItem should be in menu_order sort order.
	const sortedItems = sortBy( menuItems, 'menu_order' );

	const innerBlocks = sortedItems.map( ( menuItem ) => {
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
		const {
			innerBlocks: nestedBlocks = [], // alias to avoid shadowing
			mapping: nestedMapping = {}, // alias to avoid shadowing
		} = menuItem.children?.length
			? mapMenuItemsToBlocks( menuItem.children )
			: {};

		// Update parent mapping with nested mapping.
		mapping = {
			...mapping,
			...nestedMapping,
		};

		// Create a submenu block when there are inner blocks, or just a link
		// for a standalone item.
		const itemBlockName = nestedBlocks?.length
			? 'core/navigation-submenu'
			: 'core/navigation-link';

		// Create block with nested "innerBlocks".
		const block = createBlock( itemBlockName, attributes, nestedBlocks );

		// Create mapping for menuItem -> block
		mapping[ menuItem.id ] = block.clientId;

		return block;
	} );

	return {
		innerBlocks,
		mapping,
	};
}

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

/**
 * Convert block attributes to menu item.
 *
 * @param {WPNavMenuItem} menuItem the menu item to be converted to block attributes.
 * @return {Object} the block attributes converted from the WPNavMenuItem item.
 */
function menuItemToBlockAttributes( {
	title: menuItemTitleField,
	xfn,
	classes,
	// eslint-disable-next-line camelcase
	attrTitle,
	object,
	// eslint-disable-next-line camelcase
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

	const attributes = {
		label: menuItemTitleField?.rendered || '',
		type: object,
		kind: menuItemTypeField?.replace( '_', '-' ) || 'custom',
		url: url || '',
		rel: xfn?.join( ' ' ).trim(),
		className: classes?.join( ' ' ).trim(),
		title: attrTitle?.raw || attrTitle || menuItemTitleField?.raw,
		// eslint-disable-next-line camelcase
		...( object_id &&
			'custom' !== object && {
				id: object_id,
			} ),
		description,
		...( target === '_blank' && {
			opensInNewTab: true,
		} ),
	};

	// Filter out the empty values
	return Object.fromEntries(
		Object.entries( attributes ).filter( ( [ , v ] ) => v )
	);
}

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
			hashTable[ data[ relation ] ].children.push(
				hashTable[ data[ id ] ]
			);
		} else {
			dataTree.push( hashTable[ data[ id ] ] );
		}
	}

	return dataTree;
}
