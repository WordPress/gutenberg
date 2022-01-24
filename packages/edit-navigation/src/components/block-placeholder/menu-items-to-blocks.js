/**
 * External dependencies
 */
import { sortBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { menuItemToBlockAttributes } from '../../store/transform';

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

/** @typedef {import('../..store/utils').WPNavMenuItem} WPNavMenuItem */

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

		// Create block with nested "innerBlocks".
		const block = createBlock(
			'core/navigation-link',
			attributes,
			nestedBlocks
		);

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
