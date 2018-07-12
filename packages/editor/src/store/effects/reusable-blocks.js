/**
 * External dependencies
 */
import { map, uniqueId } from 'lodash';
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
import { select } from '@wordpress/data';

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
	saveReusableBlock as saveReusableBlockAction,
} from '../actions';
import {
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
	const { dispatch } = store;

	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use reusable blocks if undefined
	const postType = await resolveSelector( 'core', 'getPostType', 'wp_block' );
	if ( ! postType ) {
		return;
	}

	try {
		const reusableBlocks = await apiFetch( {
			path: `/wp/v2/${ postType.rest_base }?context=edit&per_page=-1`,
		} );
		dispatch( receiveReusableBlocksAction( map(
			reusableBlocks,
			( reusableBlock ) => ( {
				reusableBlock,
				parsedBlock: parse( reusableBlock.content.raw )[ 0 ],
			} )
		) ) );

		dispatch( {
			type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
		} );
	} catch ( error ) {
		dispatch( {
			type: 'FETCH_REUSABLE_BLOCKS_FAILURE',
			error,
		} );
	}
};

/**
 * Save Reusable Block Effect Handler.
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const saveReusableBlock = async ( action, store ) => {
	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use reusable blocks if undefined
	const postType = await resolveSelector( 'core', 'getPostType', 'wp_block' );
	if ( ! postType ) {
		return;
	}

	const { reusableBlock, content } = action;
	const { id, title } = reusableBlock;
	const { dispatch } = store;

	const data = { title, content, status: 'publish' };
	const path = `/wp/v2/${ postType.rest_base }`;
	const method = 'POST';

	try {
		const updatedReusableBlock = await apiFetch( { path, data, method } );
		dispatch( {
			type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
			updatedId: updatedReusableBlock.id,
			id,
		} );
		const message = __( 'Block created.' );
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

	// Remove any blocks that reference this reusable block
	const allBlocks = getBlocks( getState() );
	const associatedBlocks = allBlocks.filter( ( block ) => isReusableBlock( block ) && block.attributes.ref === id );
	const associatedBlockClientIds = associatedBlocks.map( ( block ) => block.clientId );
	dispatch( removeBlocks( associatedBlockClientIds ) );

	const transactionId = uniqueId();

	dispatch( {
		type: 'REMOVE_REUSABLE_BLOCK',
		id,
		optimist: { type: BEGIN, id: transactionId },
	} );

	try {
		await apiFetch( {
			path: `/wp/v2/${ postType.rest_base }/${ id }?force=true`,
			method: 'DELETE',
		} );
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
 * Convert a reusable block to a static block effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const convertBlockToStatic = ( action, store ) => {
	const state = store.getState();
	const oldBlock = getBlock( state, action.clientId );
	const { getEntityRecord } = select( 'core' );
	const reusableBlock = getEntityRecord( 'postType', 'wp_block', oldBlock.attributes.ref );
	const [ newBlock ] = parse( reusableBlock.content.raw );
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
	const content = serialize( parsedBlock );
	const reusableBlock = {
		id: uniqueId( 'reusable' ),
		clientId: parsedBlock.clientId,
		title: __( 'Untitled Reusable Block' ),
	};

	dispatch( receiveReusableBlocksAction( [ {
		reusableBlock,
		parsedBlock,
	} ] ) );

	dispatch( saveReusableBlockAction( reusableBlock, content ) );

	dispatch( replaceBlock(
		parsedBlock.clientId,
		createBlock( 'core/block', {
			ref: reusableBlock.id,
			layout: parsedBlock.attributes.layout,
		} )
	) );
};
