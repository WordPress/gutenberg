/**
 * External dependencies
 */
import { invert } from 'lodash';
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import {
	getMenuItemToClientIdMapping,
	resolveMenuItems,
	dispatch,
	select,
	apiFetch,
} from './controls';
import { NAVIGATION_POST_KIND, NAVIGATION_POST_POST_TYPE } from '../constants';
import {
	menuItemsQuery,
	serializeProcessing,
	computeCustomizedAttribute,
} from './utils';

const { ajaxurl } = window;

/**
 * Returns an action object used to select menu.
 *
 * @param {number} menuId The menu ID.
 * @return {Object} Action object.
 */
export function setSelectedMenuId( menuId ) {
	return {
		type: 'SET_SELECTED_MENU_ID',
		menuId,
	};
}

/**
 * Creates a menu item for every block that doesn't have an associated menuItem.
 * Requests POST /wp/v2/menu-items once for every menu item created.
 *
 * @param {Object} post A navigation post to process
 * @return {Function} An action creator
 */
export const createMissingMenuItems = serializeProcessing( function* ( post ) {
	const menuId = post.meta.menuId;

	const mapping = yield getMenuItemToClientIdMapping( post.id );
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
		// Save edits to the menu, like the menu name.
		yield dispatch(
			'core',
			'saveEditedEntityRecord',
			'root',
			'menu',
			menuId
		);

		const error = yield select(
			'core',
			'getLastEntitySaveError',
			'root',
			'menu',
			menuId
		);

		if ( error ) {
			throw new Error( error.message );
		}

		// Save blocks as menu items.
		const batchSaveResponse = yield* batchSave(
			menuId,
			menuItemsByClientId,
			post.blocks[ 0 ]
		);

		if ( ! batchSaveResponse.success ) {
			throw new Error( batchSaveResponse.data.message );
		}

		// Clear "stub" navigation post edits to avoid a false "dirty" state.
		yield dispatch(
			'core',
			'receiveEntityRecords',
			NAVIGATION_POST_KIND,
			NAVIGATION_POST_POST_TYPE,
			[ post ],
			undefined
		);

		yield dispatch(
			noticesStore,
			'createSuccessNotice',
			__( 'Navigation saved.' ),
			{
				type: 'snackbar',
			}
		);
	} catch ( saveError ) {
		const errorMessage = saveError
			? sprintf(
					/* translators: %s: The text of an error message (potentially untranslated). */
					__( "Unable to save: '%s'" ),
					saveError.message
			  )
			: __( 'Unable to save: An error ocurred.' );
		yield dispatch( noticesStore, 'createErrorNotice', errorMessage, {
			type: 'snackbar',
		} );
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
	if ( ! nonce ) {
		throw new Error();
	}

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
		url: ajaxurl || '/wp-admin/admin-ajax.php',
		method: 'POST',
		body,
	} );
}
