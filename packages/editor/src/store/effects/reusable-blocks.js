/**
 * External dependencies
 */
import { compact, map, uniqueId } from 'lodash';
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	parse,
	serialize,
	createBlock,
	isReusableBlock,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
// TODO: Ideally this would be the only dispatch in scope. This requires either
// refactoring editor actions to yielded controls, or replacing direct dispatch
// on the editor store with action creators (e.g. `REMOVE_REUSABLE_BLOCK`).
import { dispatch as dataDispatch, select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	__experimentalReceiveReusableBlocks as receiveReusableBlocksAction,
	__experimentalSaveReusableBlock as saveReusableBlock,
} from '../actions';
import {
	__experimentalGetReusableBlock as getReusableBlock,
} from '../selectors';

/**
 * Module Constants
 */
const REUSABLE_BLOCK_NOTICE_ID = 'REUSABLE_BLOCK_NOTICE_ID';

/**
 * Fetch Reusable blocks Effect Handler.
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const fetchReusableBlocks = async ( action, store ) => {
	const { id } = action;
	const { dispatch } = store;

	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use reusable blocks if undefined
	const postType = await apiFetch( { path: '/wp/v2/types/wp_block' } );
	if ( ! postType ) {
		return;
	}

	try {
		let posts;

		if ( id ) {
			posts = [ await apiFetch( { path: `/wp/v2/${ postType.rest_base }/${ id }` } ) ];
		} else {
			posts = await apiFetch( { path: `/wp/v2/${ postType.rest_base }?per_page=-1` } );
		}

		const results = compact( map( posts, ( post ) => {
			if ( post.status !== 'publish' || post.content.protected ) {
				return null;
			}

			return {
				...post,
				content: post.content.raw,
				title: post.title.raw,
			};
		} ) );

		if ( results.length ) {
			dispatch( receiveReusableBlocksAction( results ) );
		}

		dispatch( {
			type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
			id,
		} );
	} catch ( error ) {
		dispatch( {
			type: 'FETCH_REUSABLE_BLOCKS_FAILURE',
			id,
			error,
		} );
	}
};

/**
 * Save Reusable blocks Effect Handler.
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const saveReusableBlocks = async ( action, store ) => {
	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use reusable blocks if undefined
	const postType = await apiFetch( { path: '/wp/v2/types/wp_block' } );
	if ( ! postType ) {
		return;
	}

	const { id } = action;
	const { dispatch } = store;
	const state = store.getState();
	const { title, content, isTemporary } = getReusableBlock( state, id );

	const data = isTemporary ? { title, content, status: 'publish' } : { id, title, content, status: 'publish' };
	const path = isTemporary ? `/wp/v2/${ postType.rest_base }` : `/wp/v2/${ postType.rest_base }/${ id }`;
	const method = isTemporary ? 'POST' : 'PUT';

	try {
		const updatedReusableBlock = await apiFetch( { path, data, method } );
		dispatch( {
			type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
			updatedId: updatedReusableBlock.id,
			id,
		} );
		const message = isTemporary ? __( 'Block created.' ) : __( 'Block updated.' );
		dataDispatch( 'core/notices' ).createSuccessNotice( message, {
			id: REUSABLE_BLOCK_NOTICE_ID,
			type: 'snackbar',
		} );

		dataDispatch( 'core/block-editor' ).__unstableSaveReusableBlock( id, updatedReusableBlock.id );
	} catch ( error ) {
		dispatch( { type: 'SAVE_REUSABLE_BLOCK_FAILURE', id } );
		dataDispatch( 'core/notices' ).createErrorNotice( error.message, {
			id: REUSABLE_BLOCK_NOTICE_ID,
		} );
	}
};

/**
 * Delete Reusable blocks Effect Handler.
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const deleteReusableBlocks = async ( action, store ) => {
	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use reusable blocks if undefined
	const postType = await apiFetch( { path: '/wp/v2/types/wp_block' } );
	if ( ! postType ) {
		return;
	}

	const { id } = action;
	const { getState, dispatch } = store;

	// Don't allow a reusable block with a temporary ID to be deleted
	const reusableBlock = getReusableBlock( getState(), id );
	if ( ! reusableBlock || reusableBlock.isTemporary ) {
		return;
	}
	// Remove any other blocks that reference this reusable block
	const allBlocks = select( 'core/block-editor' ).getBlocks();
	const associatedBlocks = allBlocks.filter( ( block ) => isReusableBlock( block ) && block.attributes.ref === id );
	const associatedBlockClientIds = associatedBlocks.map( ( block ) => block.clientId );

	const transactionId = uniqueId();

	dispatch( {
		type: 'REMOVE_REUSABLE_BLOCK',
		id,
		optimist: { type: BEGIN, id: transactionId },
	} );

	// Remove the parsed block.
	if ( associatedBlockClientIds.length ) {
		dataDispatch( 'core/block-editor' ).removeBlocks( associatedBlockClientIds );
	}

	try {
		await apiFetch( {
			path: `/wp/v2/${ postType.rest_base }/${ id }`,
			method: 'DELETE',
		} );
		dispatch( {
			type: 'DELETE_REUSABLE_BLOCK_SUCCESS',
			id,
			optimist: { type: COMMIT, id: transactionId },
		} );
		const message = __( 'Block deleted.' );
		dataDispatch( 'core/notices' ).createSuccessNotice( message, {
			id: REUSABLE_BLOCK_NOTICE_ID,
			type: 'snackbar',
		} );
	} catch ( error ) {
		dispatch( {
			type: 'DELETE_REUSABLE_BLOCK_FAILURE',
			id,
			optimist: { type: REVERT, id: transactionId },
		} );
		dataDispatch( 'core/notices' ).createErrorNotice( error.message, {
			id: REUSABLE_BLOCK_NOTICE_ID,
		} );
	}
};

/**
 * Convert a reusable block to a static block effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const convertBlockToStatic = ( action, store ) => {
	const state = store.getState();
	const oldBlock = select( 'core/block-editor' ).getBlock( action.clientId );
	const reusableBlock = getReusableBlock( state, oldBlock.attributes.ref );
	const newBlocks = parse( reusableBlock.content );
	dataDispatch( 'core/block-editor' ).replaceBlocks( oldBlock.clientId, newBlocks );
};

/**
 * Convert a static block to a reusable block effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const convertBlockToReusable = ( action, store ) => {
	const { dispatch } = store;
	const reusableBlock = {
		id: uniqueId( 'reusable' ),
		title: __( 'Untitled Reusable Block' ),
		content: serialize( select( 'core/block-editor' ).getBlocksByClientId( action.clientIds ) ),
	};

	dispatch( receiveReusableBlocksAction( [
		reusableBlock,
	] ) );
	dispatch( saveReusableBlock( reusableBlock.id ) );

	dataDispatch( 'core/block-editor' ).replaceBlocks(
		action.clientIds,
		createBlock( 'core/block', {
			ref: reusableBlock.id,
		} )
	);
};
