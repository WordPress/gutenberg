/**
 * External dependencies
 */
import { invert, keyBy, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { select, resolveMenuItems, dispatch, apiFetch } from './controls';
import { uuidv4, menuItemsQuery, KIND, POST_TYPE } from './utils';

// Hits POST /wp/v2/menu-items once for every Link block that doesn't have an
// associated menu item. (IDK what a good name for this is.)
export const createMissingMenuItems = serializeProcessing( function* ( post ) {
	const menuId = post.meta.menuId;
	const mapping = post.meta.menuItemIdToClientId;
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

	yield dispatch( 'core', 'editEntityRecord', KIND, POST_TYPE, post.id, {
		meta: {
			...post.meta,
			menuItemIdToClientId: mapping,
		},
	} );
} );

export const saveNavigationPost = serializeProcessing( function* ( post ) {
	const menuId = post.meta.menuId;
	const menuItemsByClientId = mapMenuItemsByClientId(
		yield resolveMenuItems( menuId ),
		post.meta.menuItemIdToClientId
	);

	try {
		yield* batchSave( menuId, menuItemsByClientId, post.blocks[ 0 ] );
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
	body.append( 'customize_changeset_uuid', uuidv4() );
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

	yield apiFetch( {
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

function serializeProcessing( callback ) {
	return function* ( menuId ) {
		const isProcessing = yield select(
			'core/edit-navigation',
			'isProcessingMenuItems',
			menuId
		);

		if ( isProcessing ) {
			yield {
				type: 'ENQUEUE_AFTER_PROCESSING',
				menuId,
				action: callback,
			};
			return { status: 'pending' };
		}

		yield {
			type: 'START_PROCESSING_MENU_ITEMS',
			menuId,
		};

		try {
			yield* callback( menuId );
		} finally {
			yield {
				type: 'FINISH_PROCESSING_MENU_ITEMS',
				menuId,
			};

			const pendingActions = yield select(
				'core/edit-navigation',
				'getPendingActions',
				menuId
			);
			if ( pendingActions.length ) {
				yield* pendingActions[ 0 ]( menuId );
			}
		}
	};
}
