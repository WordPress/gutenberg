/**
 * External dependencies
 */
import { uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { registerStore, select, subscribe, dispatch } from '@wordpress/data';

export const STORE_NAMESPACE = 'core/post-deduplication';

const blockNames = new Set();

/**
 * Add a block to be watched for deduplication
 *
 * @param {string} blockName
 */
export const registerDeduplicatedBlock = ( blockName ) =>
	blockNames.add( blockName );

const initialState = {
	queryBlocks: [], // list of Query blocks in the order they are on the page
	postsByBlock: {}, // map of returned posts to block clientId
	specificPostsByBlock: {}, // posts displayed by specific-mode, which always return in the selector
};

const UPDATE_BLOCKS = 'UPDATE_BLOCKS';
const MARK_POSTS_DISPLAYED = 'MARK_POSTS_DISPLAYED';
const MARK_SPECIFIC_POSTS_DISPLAYED = 'MARK_SPECIFIC_POSTS_DISPLAYED';

const actions = {
	updateBlocks( blocks ) {
		return {
			type: UPDATE_BLOCKS,
			blocks,
		};
	},
	markPostsAsDisplayed( clientId, posts ) {
		return {
			type: MARK_POSTS_DISPLAYED,
			clientId,
			posts,
		};
	},
	markSpecificPostsAsDisplayed( clientId, posts ) {
		return {
			type: MARK_SPECIFIC_POSTS_DISPLAYED,
			clientId,
			posts,
		};
	},
};

/**
 * Returns the Query blocks that appear before the current one on the page
 *
 * @param {Array} orderedBlocks An array of Block objects in the order on the page
 * @param {string} clientId Client ID of the Block to find blocks before
 */
const blocksBefore = ( orderedBlocks, clientId ) => {
	const ourBlockIdx = orderedBlocks.findIndex(
		( b ) => b.clientId === clientId
	);
	return orderedBlocks.slice( 0, ourBlockIdx );
};

const selectors = {
	previousPostIds( state, clientId ) {
		const { queryBlocks, specificPostsByBlock, postsByBlock } = state;

		const postIdsFromSpecificMode = queryBlocks
			.filter( ( b ) => specificPostsByBlock[ b.clientId ] )
			.flatMap( ( b ) =>
				specificPostsByBlock[ b.clientId ].map( ( p ) => p.id )
			);

		const previousPostIds = blocksBefore( queryBlocks, clientId )
			.filter( ( b ) => postsByBlock[ b.clientId ] )
			.flatMap( ( b ) =>
				postsByBlock[ b.clientId ].map( ( p ) => p.id )
			);

		return uniq( postIdsFromSpecificMode.concat( previousPostIds ) ).sort();
	},
};

/**
 * Returns an array of all registered blocks in the order they are on
 * the page. This is needed to be able to show the editor blocks in the order
 * that PHP will render them.
 *
 * @param {Array} blocks an array of all blocks in orders
 */
const getQueryBlocksInOrder = ( blocks ) =>
	blocks.flatMap( ( block ) => {
		const queryBlocks = [];
		if ( blockNames.has( block.name ) ) {
			queryBlocks.push( block );
		}
		return queryBlocks.concat( getQueryBlocksInOrder( block.innerBlocks ) );
	} );

const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case UPDATE_BLOCKS:
			const updateBlocksState = {
				...state,
				queryBlocks: getQueryBlocksInOrder( action.blocks ),
			};
			return updateBlocksState;
		case MARK_POSTS_DISPLAYED:
			return {
				...state,
				postsByBlock: {
					...state.postsByBlock,
					[ action.clientId ]: action.posts,
				},
			};
		case MARK_SPECIFIC_POSTS_DISPLAYED:
			return {
				...state,
				specificPostsByBlock: {
					...state.specificPostsByBlock,
					[ action.clientId ]: action.posts,
				},
			};
	}
	return state;
};

let registered = false;
export const registerQueryStore = () => {
	if ( registered ) return;

	registerStore( STORE_NAMESPACE, {
		reducer,
		actions,
		selectors,
		initialState,
	} );

	const { getClientIdsWithDescendants, getBlocks } = select(
		'core/block-editor'
	);
	const { updateBlocks } = dispatch( STORE_NAMESPACE );

	let currentBlocksIds;
	subscribe( () => {
		const newBlocksIds = getClientIdsWithDescendants();
		const blocksChanged = newBlocksIds !== currentBlocksIds;
		currentBlocksIds = newBlocksIds;

		if ( blocksChanged ) {
			updateBlocks( getBlocks() );
		}
	} );

	registered = true;
};
