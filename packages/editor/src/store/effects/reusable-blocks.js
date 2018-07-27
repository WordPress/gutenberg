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
	isReusableBlock,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { resolveSelector } from './utils';
import {
	receiveReusableBlocks as receiveReusableBlocksAction,
	createSuccessNotice,
	createErrorNotice,
	removeBlocks,
	replaceBlock,
	receiveBlocks,
	saveReusableBlock,
} from '../actions';
import {
	getReusableBlock,
	getBlock,
	getBlocks,
} from '../selectors';

/**
 * Module Constants
 */
const REUSABLE_BLOCK_NOTICE_ID = 'REUSABLE_BLOCK_NOTICE_ID';

/**
 * Fetch Reusable Blocks Effect Handler.
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const fetchReusableBlocks = async ( action, store ) => {
	const { id } = action;
	const { dispatch } = store;

	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use reusable blocks if undefined
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
		const reusableBlockOrBlocks = await result;
		dispatch( receiveReusableBlocksAction( map(
			castArray( reusableBlockOrBlocks ),
			( reusableBlock ) => ( {
				reusableBlock,
				parsedBlock: parse( reusableBlock.content )[ 0 ],
			} )
		) ) );

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
 * Save Reusable Blocks Effect Handler.
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const saveReusableBlocks = async ( action, store ) => {
	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use reusable blocks if undefined
	const postType = await resolveSelector( 'core', 'getPostType', 'wp_block' );
	if ( ! postType ) {
		return;
	}

	const { id } = action;
	const { dispatch } = store;
	const state = store.getState();
	const { clientId, title, isTemporary } = getReusableBlock( state, id );
	const { name, attributes, innerBlocks } = getBlock( state, clientId );
	const content = serialize( createBlock( name, attributes, innerBlocks ) );

	const data = isTemporary ? { title, content } : { id, title, content };
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
		dispatch( createSuccessNotice( message, { id: REUSABLE_BLOCK_NOTICE_ID } ) );
	} catch ( error ) {
		dispatch( { type: 'SAVE_REUSABLE_BLOCK_FAILURE', id } );
		dispatch( createErrorNotice( error.message, {
			id: REUSABLE_BLOCK_NOTICE_ID,
			spokenMessage: error.message,
		} ) );
	}
};

/**
 * Delete Reusable Blocks Effect Handler.
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const deleteReusableBlocks = async ( action, store ) => {
	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use reusable blocks if undefined
	const postType = await resolveSelector( 'core', 'getPostType', 'wp_block' );
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
	const allBlocks = getBlocks( getState() );
	const associatedBlocks = allBlocks.filter( ( block ) => isReusableBlock( block ) && block.attributes.ref === id );
	const associatedBlockClientIds = associatedBlocks.map( ( block ) => block.clientId );

	const transactionId = uniqueId();

	dispatch( {
		type: 'REMOVE_REUSABLE_BLOCK',
		id,
		optimist: { type: BEGIN, id: transactionId },
	} );

	// Remove the parsed block.
	dispatch( removeBlocks( [
		...associatedBlockClientIds,
		reusableBlock.clientId,
	] ) );

	try {
		await apiFetch( { path: `/wp/v2/${ postType.rest_base }/${ id }`, method: 'DELETE' } );
		dispatch( {
			type: 'DELETE_REUSABLE_BLOCK_SUCCESS',
			id,
			optimist: { type: COMMIT, id: transactionId },
		} );
		const message = __( 'Block deleted.' );
		dispatch( createSuccessNotice( message, { id: REUSABLE_BLOCK_NOTICE_ID } ) );
	} catch ( error ) {
		dispatch( {
			type: 'DELETE_REUSABLE_BLOCK_FAILURE',
			id,
			optimist: { type: REVERT, id: transactionId },
		} );
		dispatch( createErrorNotice( error.message, {
			id: REUSABLE_BLOCK_NOTICE_ID,
			spokenMessage: error.message,
		} ) );
	}
};

/**
 * Receive Reusable Blocks Effect Handler.
 *
 * @param {Object} action  action object.
 * @return {Object} receive blocks action
 */
export const receiveReusableBlocks = ( action ) => {
	return receiveBlocks( map( action.results, 'parsedBlock' ) );
};

/**
 * Convert a reusable block to a static block effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const convertBlockToStatic = ( action, store ) => {
	const state = store.getState();
	const oldBlock = getBlock( state, action.clientId );
	const reusableBlock = getReusableBlock( state, oldBlock.attributes.ref );
	const referencedBlock = getBlock( state, reusableBlock.clientId );
	const newBlock = createBlock( referencedBlock.name, referencedBlock.attributes );
	store.dispatch( replaceBlock( oldBlock.clientId, newBlock ) );
};

/**
 * Convert a static block to a reusable block effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const convertBlockToReusable = ( action, store ) => {
	const { getState, dispatch } = store;

	const parsedBlock = getBlock( getState(), action.clientId );
	const reusableBlock = {
		id: uniqueId( 'reusable' ),
		clientId: parsedBlock.clientId,
		title: __( 'Untitled Reusable Block' ),
	};

	dispatch( receiveReusableBlocksAction( [ {
		reusableBlock,
		parsedBlock,
	} ] ) );

	dispatch( saveReusableBlock( reusableBlock.id ) );

	dispatch( replaceBlock(
		parsedBlock.clientId,
		createBlock( 'core/block', {
			ref: reusableBlock.id,
			layout: parsedBlock.attributes.layout,
		} )
	) );

	// Re-add the original block to the store, since replaceBlock() will have removed it
	dispatch( receiveBlocks( [ parsedBlock ] ) );
};
