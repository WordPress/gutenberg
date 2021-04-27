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
			attributes = {
				title: block.attributes?.label,
				original_title: '',
				url: block.attributes.url,
				description: block.attributes.description,
				xfn: block.attributes.rel?.split( ' ' ),
				classes: block.attributes.className?.split( ' ' ),
				attr_title: block.attributes.title,
				...( block.attributes?.type &&
					mapBlockAttributeToMenuItemField(
						'type',
						block.attributes?.type
					) ),
				...( block.attributes?.id &&
					block.attributes?.type !== 'custom' &&
					mapBlockAttributeToMenuItemField(
						'id',
						block.attributes?.id
					) ),
				...( block.attributes?.kind &&
					mapBlockAttributeToMenuItemField(
						'kind',
						block.attributes?.kind
					) ),
				target: block.attributes.opensInNewTab
					? NEW_TAB_TARGET_ATTRIBUTE
					: '',
			};
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
 * Maps a given block attribute to its equivalent menu item field.
 *
 * @param {string} blockAttributeName the name of the block attribute to be mapped.
 * @param {string} blockAttributeValue the value of the block attribute to be mapped.
 * @return {Object} block attribute mapped to correct menu item.
 */
export const mapBlockAttributeToMenuItemField = function mapBlockAttributeToMenuItemField(
	blockAttributeName,
	blockAttributeValue
) {
	const MAPPING = {
		id: 'object_id',
		type: 'object',
		// `nav_menu_item` may be one of:
		// 1. `post_type`,
		// 2. `post_type_archive`,
		// 3. `taxonomy`,
		// 4. `custom`.
		kind: {
			attr: 'type', // the equivalent on `nav_menu_item` is "type" but it is stored with underscores whereas the block attr uses hyphens.
			mapper: () => blockAttributeValue.replace( '-', '_' ),
		},
	};

	return convertAttribute( MAPPING, blockAttributeName, blockAttributeValue );
};

/**
 * Maps a given menu item field to its equivalent block attribute.
 *
 * @param {string} menuItemField the name of the menu item field to be mapped.
 * @param {string} menuItemVal the value of the menu item field to be mapped.
 * @return {Object} menu item field mapped to correct block attribute.
 */
export const mapMenuItemFieldToBlockAttribute = function mapMenuItemFieldToBlockAttribute(
	menuItemField,
	menuItemVal
) {
	const MAPPING = {
		object_id: 'id',
		object: 'type',
		// `nav_menu_item` may be one of:
		// 1. `post_type`,
		// 2. `post_type_archive`,
		// 3. `taxonomy`,
		// 4. `custom`.
		type: {
			attr: 'kind', // the equivalent on `nav_menu_item` is "type" but it is stored with underscores whereas the block attr uses hyphens.
			mapper: () => menuItemVal.replace( '_', '-' ),
		},
	};

	return convertAttribute( MAPPING, menuItemField, menuItemVal );
};

/**
 * Converts a given key in an object to it's mapped equivalent.
 *
 * Typically used to convert block attributes to their equivalent menu item fields.
 *
 * @param {Object} mapping a key/value mapping of attributes to their equivalents.
 * @param {string} key the name of the key within the mapping to be converted.
 * @param {string} val the value to be assigned to the converted field.
 * @return {Object} the converted field object.
 */
const convertAttribute = function convertAttribute( mapping, key, val ) {
	// If there is no mapping for this key then default to assuming a 1:1 relationship.
	if ( ! mapping[ key ] ) {
		return {
			[ key ]: val,
		};
	}

	const left = mapping[ key ].attr ?? mapping[ key ];
	const right = mapping[ key ].mapper?.() ?? val;

	return {
		[ left ]: right,
	};
};
