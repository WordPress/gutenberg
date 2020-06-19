/**
 * External dependencies
 */
import { invert, keyBy, omit } from 'lodash';
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	getNavigationPostForMenu,
	getPendingActions,
	isProcessingPost,
	getMenuItemToClientIdMapping,
	resolveMenuItems,
	dispatch,
	apiFetch,
} from './controls';
import { menuItemsQuery } from './utils';

/**
 * Creates a menu item for every block that doesn't have an associated menuItem.
 * Requests POST /wp/v2/menu-items once for every menu item created.
 *
 * @param {Object} post A navigation post to process
 * @return {Function} An action creator
 */
export const createMissingMenuItems = serializeProcessing( function* ( post ) {
	const menuId = post.meta.menuId;

	const mapping = yield {
		type: 'GET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
		postId: post.id,
	};
	const clientIdToMenuId = invert( mapping );

	const stack = [ post.blocks[ 0 ] ];
	while ( stack.length ) {
		const block = stack.pop();
		if ( ! ( block.clientId in clientIdToMenuId ) ) {
			const menuItem = yield apiFetch( {
				path: `/__experimental/menu-items`,
				method: 'POST',
				data: {
					title: 'Placeholder',
					url: 'Placeholder',
					menu_order: 0,
				},
			} );

			mapping[ menuItem.id ] = block.clientId;
			const menuItems = yield resolveMenuItems( menuId );
			yield dispatch(
				'core',
				'receiveEntityRecords',
				'root',
				'menuItem',
				[ ...menuItems, menuItem ],
				menuItemsQuery( menuId ),
				false
			);
		}
		stack.push( ...block.innerBlocks );
	}

	yield {
		type: 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
		postId: post.id,
		mapping,
	};
} );

/**
 * Converts all the blocks into menu items and submits a batch request to save everything at once.
 *
 * @param {Object} post A navigation post to process
 * @return {Function} An action creator
 */
export const saveNavigationPost = serializeProcessing( function* ( post ) {
	const menuId = post.meta.menuId;
	const menuItemsByClientId = mapMenuItemsByClientId(
		yield resolveMenuItems( menuId ),
		yield getMenuItemToClientIdMapping( post.id )
	);

	try {
		const response = yield* batchSave(
			menuId,
			menuItemsByClientId,
			post.blocks[ 0 ]
		);
		if ( ! response.success ) {
			throw new Error();
		}
		yield dispatch(
			'core/notices',
			'createSuccessNotice',
			__( 'Navigation saved.' ),
			{
				type: 'snackbar',
			}
		);
	} catch ( e ) {
		yield dispatch(
			'core/notices',
			'createErrorNotice',
			__( 'There was an error.' ),
			{
				type: 'snackbar',
			}
		);
	}
} );

function mapMenuItemsByClientId( menuItems, clientIdsByMenuId ) {
	const result = {};
	if ( ! menuItems || ! clientIdsByMenuId ) {
		return result;
	}
	for ( const menuItem of menuItems ) {
		const clientId = clientIdsByMenuId[ menuItem.id ];
		if ( clientId ) {
			result[ clientId ] = menuItem;
		}
	}
	return result;
}

function* batchSave( menuId, menuItemsByClientId, navigationBlock ) {
	const { nonce, stylesheet } = yield apiFetch( {
		path: '/__experimental/customizer-nonces/get-save-nonce',
	} );

	// eslint-disable-next-line no-undef
	const body = new FormData();
	body.append( 'wp_customize', 'on' );
	body.append( 'customize_theme', stylesheet );
	body.append( 'nonce', nonce );
	body.append( 'customize_changeset_uuid', uuid() );
	body.append( 'customize_autosaved', 'on' );
	body.append( 'customize_changeset_status', 'publish' );
	body.append( 'action', 'customize_save' );
	body.append(
		'customized',
		computeCustomizedAttribute(
			navigationBlock.innerBlocks,
			menuId,
			menuItemsByClientId
		)
	);

	return yield apiFetch( {
		url: '/wp-admin/admin-ajax.php',
		method: 'POST',
		body,
	} );
}

function computeCustomizedAttribute( blocks, menuId, menuItemsByClientId ) {
	const blocksList = blocksTreeToFlatList( blocks );
	const dataList = blocksList.map( ( { block, parentId, position } ) =>
		linkBlockToRequestItem( block, parentId, position )
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

	function linkBlockToRequestItem( block, parentId, position ) {
		const menuItem = omit( getMenuItemForBlock( block ), 'menus', 'meta' );
		return {
			...menuItem,
			position,
			title: block.attributes?.label,
			url: block.attributes.url,
			original_title: '',
			classes: ( menuItem.classes || [] ).join( ' ' ),
			xfn: ( menuItem.xfn || [] ).join( ' ' ),
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
 * This wrapper guarantees serial execution of data processing actions.
 *
 * Examples:
 * * saveNavigationPost() needs to wait for all the missing items to be created.
 * * Concurrent createMissingMenuItems() could result in sending more requests than required.
 *
 * @param {Function} callback An action creator to wrap
 * @return {Function} Original callback wrapped in a serial execution context
 */
function serializeProcessing( callback ) {
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
			yield* callback( post );
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

				// re-fetch the post as running the callback() likely updated it
				yield* serializedCallback(
					yield getNavigationPostForMenu( post.meta.menuId )
				);
			}
		}
	};
}
