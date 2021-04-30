/**
 * External dependencies
 */
import { keyBy, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getNavigationPostForMenu,
	getPendingActions,
	isProcessingPost,
} from './controls';

import { NEW_TAB_TARGET_ATTRIBUTE } from '../constants';

/**
 * Builds an ID for a new navigation post.
 *
 * @param {number} menuId Menu id.
 * @return {string} An ID.
 */
export const buildNavigationPostId = ( menuId ) =>
	`navigation-post-${ menuId }`;

/**
 * Builds a query to resolve menu items.
 *
 * @param {number} menuId Menu id.
 * @return {Object} Query.
 */
export function menuItemsQuery( menuId ) {
	return { menus: menuId, per_page: -1 };
}

/**
 * This wrapper guarantees serial execution of data processing actions.
 *
 * Examples:
 * * saveNavigationPost() needs to wait for all the missing items to be created.
 * * Concurrent createMissingMenuItems() could result in sending more requests than required.
 *
 * @param {Function} callback An action creator to wrap
 * @return {Function} Original callback wrapped in a serial execution context
 */
export function serializeProcessing( callback ) {
	return function* ( post ) {
		const postId = post.id;
		const isProcessing = yield isProcessingPost( postId );

		if ( isProcessing ) {
			yield {
				type: 'ENQUEUE_AFTER_PROCESSING',
				postId,
				action: callback,
			};
			return { status: 'pending' };
		}
		yield {
			type: 'POP_PENDING_ACTION',
			postId,
			action: callback,
		};

		yield {
			type: 'START_PROCESSING_POST',
			postId,
		};

		try {
			yield* callback(
				// re-select the post as it could be outdated by now
				yield getNavigationPostForMenu( post.meta.menuId )
			);
		} finally {
			yield {
				type: 'FINISH_PROCESSING_POST',
				postId,
				action: callback,
			};

			const pendingActions = yield getPendingActions( postId );
			if ( pendingActions.length ) {
				const serializedCallback = serializeProcessing(
					pendingActions[ 0 ]
				);

				yield* serializedCallback( post );
			}
		}
	};
}

export function computeCustomizedAttribute(
	blocks,
	menuId,
	menuItemsByClientId
) {
	const blocksList = blocksTreeToFlatList( blocks );
	const dataList = blocksList.map( ( { block, parentId, position } ) =>
		blockToRequestItem( block, parentId, position )
	);

	// Create an object like { "nav_menu_item[12]": {...}} }
	const computeKey = ( item ) => `nav_menu_item[${ item.id }]`;
	const dataObject = keyBy( dataList, computeKey );

	// Deleted menu items should be sent as false, e.g. { "nav_menu_item[13]": false }
	for ( const clientId in menuItemsByClientId ) {
		const key = computeKey( menuItemsByClientId[ clientId ] );
		if ( ! ( key in dataObject ) ) {
			dataObject[ key ] = false;
		}
	}

	return JSON.stringify( dataObject );

	function blocksTreeToFlatList( innerBlocks, parentId = 0 ) {
		return innerBlocks.flatMap( ( block, index ) =>
			[ { block, parentId, position: index + 1 } ].concat(
				blocksTreeToFlatList(
					block.innerBlocks,
					getMenuItemForBlock( block )?.id
				)
			)
		);
	}

	function blockToRequestItem( block, parentId, position ) {
		const menuItem = omit( getMenuItemForBlock( block ), 'menus', 'meta' );

		let attributes;

		if ( block.name === 'core/navigation-link' ) {
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
			position,
			nav_menu_term_id: menuId,
			menu_item_parent: parentId,
			status: 'publish',
			_invalid: false,
		};
	}

	function getMenuItemForBlock( block ) {
		return omit( menuItemsByClientId[ block.clientId ] || {}, '_links' );
	}
}

/**
 * Convert block attributes to menu item fields.
 *
 * Note that nav_menu_item has defaults provided in Core so in the case of undefined Block attributes
 * we need only include a subset of values in the knowledge that the defaults will be provided in Core.
 *
 * See: https://core.trac.wordpress.org/browser/tags/5.7.1/src/wp-includes/nav-menu.php#L438.
 *
 * @param {Object} blockAttributes the block attributes of the block to be converted into menu item fields.
 * @param {string} blockAttributes.label the visual name of the block shown in the UI.
 * @param {string} blockAttributes.url the URL for the link.
 * @param {string} blockAttributes.description a link description.
 * @param {string} blockAttributes.rel the XFN relationship expressed in the link of this menu item.
 * @param {string} blockAttributes.className the custom CSS classname attributes for this block.
 * @param {string} blockAttributes.title the HTML title attribute for the block's link.
 * @param {string} blockAttributes.type the type of variation of the block used (eg: 'Post', 'Custom', 'Category'...etc).
 * @param {number} blockAttributes.id the ID of the entity optionally associated with the block's link (eg: the Post ID).
 * @param {string} blockAttributes.kind the family of objects originally represented, such as 'post-type' or 'taxonomy'.
 * @param {boolean} blockAttributes.opensInNewTab whether or not the block's link should open in a new tab.
 * @return {Object} the menu item (converted from block attributes).
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
	return {
		title: {
			rendered: label,
			raw: label,
		},
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
		...( opensInNewTab && {
			target: NEW_TAB_TARGET_ATTRIBUTE,
		} ),
	};
};

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
		...( xfn?.length && {
			rel: xfn.join( ' ' ).trim(),
		} ),
		...( classes?.length && {
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
		...( target === NEW_TAB_TARGET_ATTRIBUTE && {
			opensInNewTab: true,
		} ),
	};
};
