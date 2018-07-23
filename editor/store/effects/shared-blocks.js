/**
 * External dependencies
 */
import { castArray, map, uniqueId } from 'lodash';
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	parse,
	serialize,
	createBlock,
	isSharedBlock,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { resolveSelector } from './utils';
import {
	receiveSharedBlocks as receiveSharedBlocksAction,
	createSuccessNotice,
	createErrorNotice,
	removeBlocks,
	replaceBlock,
	receiveBlocks,
	saveSharedBlock,
} from '../actions';
import {
	getSharedBlock,
	getBlock,
	getBlocks,
} from '../selectors';

/**
 * Module Constants
 */
const SHARED_BLOCK_NOTICE_ID = 'SHARED_BLOCK_NOTICE_ID';

/**
 * Fetch Shared Blocks Effect Handler.
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const fetchSharedBlocks = async ( action, store ) => {
	const { id } = action;
	const { dispatch } = store;

	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use shared blocks if undefined
	const postType = await resolveSelector( 'core', 'getPostType', 'wp_block' );
	if ( ! postType ) {
		return;
	}

	let result;
	if ( id ) {
		result = apiFetch( { path: `/wp/v2/${ postType.rest_base }/${ id }` } );
	} else {
		result = apiFetch( { path: `/wp/v2/${ postType.rest_base }?per_page=-1` } );
	}

	try {
		const sharedBlockOrBlocks = await result;
		dispatch( receiveSharedBlocksAction( map(
			castArray( sharedBlockOrBlocks ),
			( sharedBlock ) => ( {
				sharedBlock,
				parsedBlock: parse( sharedBlock.content )[ 0 ],
			} )
		) ) );

		dispatch( {
			type: 'FETCH_SHARED_BLOCKS_SUCCESS',
			id,
		} );
	} catch ( error ) {
		dispatch( {
			type: 'FETCH_SHARED_BLOCKS_FAILURE',
			id,
			error,
		} );
	}
};

/**
 * Save Shared Blocks Effect Handler.
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const saveSharedBlocks = async ( action, store ) => {
	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use shared blocks if undefined
	const postType = await resolveSelector( 'core', 'getPostType', 'wp_block' );
	if ( ! postType ) {
		return;
	}

	const { id } = action;
	const { dispatch } = store;
	const state = store.getState();
	const { clientId, title, isTemporary } = getSharedBlock( state, id );
	const { name, attributes, innerBlocks } = getBlock( state, clientId );
	const content = serialize( createBlock( name, attributes, innerBlocks ) );

	const data = isTemporary ? { title, content } : { id, title, content };
	const path = isTemporary ? `/wp/v2/${ postType.rest_base }` : `/wp/v2/${ postType.rest_base }/${ id }`;
	const method = isTemporary ? 'POST' : 'PUT';

	try {
		const updatedSharedBlock = await apiFetch( { path, data, method } );
		dispatch( {
			type: 'SAVE_SHARED_BLOCK_SUCCESS',
			updatedId: updatedSharedBlock.id,
			id,
		} );
		const message = isTemporary ? __( 'Block created.' ) : __( 'Block updated.' );
		dispatch( createSuccessNotice( message, { id: SHARED_BLOCK_NOTICE_ID } ) );
	} catch ( error ) {
		dispatch( { type: 'SAVE_SHARED_BLOCK_FAILURE', id } );
		dispatch( createErrorNotice( error.message, {
			id: SHARED_BLOCK_NOTICE_ID,
			spokenMessage: error.message,
		} ) );
	}
};

/**
 * Delete Shared Blocks Effect Handler.
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const deleteSharedBlocks = async ( action, store ) => {
	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use shared blocks if undefined
	const postType = await resolveSelector( 'core', 'getPostType', 'wp_block' );
	if ( ! postType ) {
		return;
	}

	const { id } = action;
	const { getState, dispatch } = store;

	// Don't allow a shared block with a temporary ID to be deleted
	const sharedBlock = getSharedBlock( getState(), id );
	if ( ! sharedBlock || sharedBlock.isTemporary ) {
		return;
	}

	// Remove any other blocks that reference this shared block
	const allBlocks = getBlocks( getState() );
	const associatedBlocks = allBlocks.filter( ( block ) => isSharedBlock( block ) && block.attributes.ref === id );
	const associatedBlockClientIds = associatedBlocks.map( ( block ) => block.clientId );

	const transactionId = uniqueId();

	dispatch( {
		type: 'REMOVE_SHARED_BLOCK',
		id,
		optimist: { type: BEGIN, id: transactionId },
	} );

	// Remove the parsed block.
	dispatch( removeBlocks( [
		...associatedBlockClientIds,
		sharedBlock.clientId,
	] ) );

	try {
		await apiFetch( { path: `/wp/v2/${ postType.rest_base }/${ id }`, method: 'DELETE' } );
		dispatch( {
			type: 'DELETE_SHARED_BLOCK_SUCCESS',
			id,
			optimist: { type: COMMIT, id: transactionId },
		} );
		const message = __( 'Block deleted.' );
		dispatch( createSuccessNotice( message, { id: SHARED_BLOCK_NOTICE_ID } ) );
	} catch ( error ) {
		dispatch( {
			type: 'DELETE_SHARED_BLOCK_FAILURE',
			id,
			optimist: { type: REVERT, id: transactionId },
		} );
		dispatch( createErrorNotice( error.message, {
			id: SHARED_BLOCK_NOTICE_ID,
			spokenMessage: error.message,
		} ) );
	}
};

/**
 * Receive Shared Blocks Effect Handler.
 *
 * @param {Object} action  action object.
 * @return {Object} receive blocks action
 */
export const receiveSharedBlocks = ( action ) => {
	return receiveBlocks( map( action.results, 'parsedBlock' ) );
};

/**
 * Convert a shared block to a static block effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const convertBlockToStatic = ( action, store ) => {
	const state = store.getState();
	const oldBlock = getBlock( state, action.clientId );
	const sharedBlock = getSharedBlock( state, oldBlock.attributes.ref );
	const referencedBlock = getBlock( state, sharedBlock.clientId );
	const newBlock = createBlock( referencedBlock.name, referencedBlock.attributes );
	store.dispatch( replaceBlock( oldBlock.clientId, newBlock ) );
};

/**
 * Convert a static block to a shared block effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const convertBlockToShared = ( action, store ) => {
	const { getState, dispatch } = store;

	const parsedBlock = getBlock( getState(), action.clientId );
	const sharedBlock = {
		id: uniqueId( 'shared' ),
		clientId: parsedBlock.clientId,
		title: __( 'Untitled shared block' ),
	};

	dispatch( receiveSharedBlocksAction( [ {
		sharedBlock,
		parsedBlock,
	} ] ) );

	dispatch( saveSharedBlock( sharedBlock.id ) );

	dispatch( replaceBlock(
		parsedBlock.clientId,
		createBlock( 'core/block', {
			ref: sharedBlock.id,
			layout: parsedBlock.attributes.layout,
		} )
	) );

	// Re-add the original block to the store, since replaceBlock() will have removed it
	dispatch( receiveBlocks( [ parsedBlock ] ) );
};
