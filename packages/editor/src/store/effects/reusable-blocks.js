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
	cloneBlock,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
// TODO: Ideally this would be the only dispatch in scope. This requires either
// refactoring editor actions to yielded controls, or replacing direct dispatch
// on the editor store with action creators (e.g. `REMOVE_REUSABLE_BLOCK`).
import { dispatch as dataDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	__experimentalReceiveReusableBlocks as receiveReusableBlocksAction,
	removeBlocks,
	replaceBlocks,
	receiveBlocks,
	__experimentalSaveReusableBlock as saveReusableBlock,
} from '../actions';
import {
	__experimentalGetReusableBlock as getReusableBlock,
	getBlock,
	getBlocks,
	getBlocksByClientId,
} from '../selectors';
import { getPostRawValue } from '../reducer';

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

			const parsedBlocks = parse( post.content.raw );
			return {
				reusableBlock: {
					id: post.id,
					title: getPostRawValue( post.title ),
				},
				parsedBlock: parsedBlocks.length === 1 ?
					parsedBlocks[ 0 ] :
					createBlock( 'core/template', {}, parsedBlocks ),
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
 * Save Reusable Blocks Effect Handler.
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
	const { clientId, title, isTemporary } = getReusableBlock( state, id );
	const reusableBlock = getBlock( state, clientId );
	const content = serialize( reusableBlock.name === 'core/template' ? reusableBlock.innerBlocks : reusableBlock );

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
		} );
	} catch ( error ) {
		dispatch( { type: 'SAVE_REUSABLE_BLOCK_FAILURE', id } );
		dataDispatch( 'core/notices' ).createErrorNotice( error.message, {
			id: REUSABLE_BLOCK_NOTICE_ID,
		} );
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
	let newBlocks;
	if ( referencedBlock.name === 'core/template' ) {
		newBlocks = referencedBlock.innerBlocks.map( ( innerBlock ) => cloneBlock( innerBlock ) );
	} else {
		newBlocks = [ cloneBlock( referencedBlock ) ];
	}
	store.dispatch( replaceBlocks( oldBlock.clientId, newBlocks ) );
};

/**
 * Convert a static block to a reusable block effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const convertBlockToReusable = ( action, store ) => {
	const { getState, dispatch } = store;
	let parsedBlock;
	if ( action.clientIds.length === 1 ) {
		parsedBlock = getBlock( getState(), action.clientIds[ 0 ] );
	} else {
		parsedBlock = createBlock(
			'core/template',
			{},
			getBlocksByClientId( getState(), action.clientIds )
		);

		// This shouldn't be necessary but at the moment
		// we expect the content of the shared blocks to live in the blocks state.
		dispatch( receiveBlocks( [ parsedBlock ] ) );
	}

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

	dispatch( replaceBlocks(
		action.clientIds,
		createBlock( 'core/block', {
			ref: reusableBlock.id,
		} )
	) );

	// Re-add the original block to the store, since replaceBlock() will have removed it
	dispatch( receiveBlocks( [ parsedBlock ] ) );
};
