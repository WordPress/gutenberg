/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress Dependencies
 */
import { switchToBlockType } from 'blocks';

/**
 * Returns an action object used in signalling that the block with the
 * specified UID has been updated.
 *
 * @param  {String} uid        Block UID
 * @param  {Object} attributes Block attributes to be merged
 * @return {Object}            Action object
 */
export function updateBlockAttributes( uid, attributes ) {
	return {
		type: 'UPDATE_BLOCK_ATTRIBUTES',
		uid,
		attributes,
	};
}

export function focusBlock( uid, config ) {
	return {
		type: 'UPDATE_FOCUS',
		uid,
		config,
	};
}

export function deselectBlock( uid ) {
	return {
		type: 'TOGGLE_BLOCK_SELECTED',
		selected: false,
		uid,
	};
}

export function multiSelect( start, end ) {
	return {
		type: 'MULTI_SELECT',
		start,
		end,
	};
}

export function clearSelectedBlock() {
	return {
		type: 'CLEAR_SELECTED_BLOCK',
	};
}

export function replaceBlocks( uids, blocks ) {
	return {
		type: 'REPLACE_BLOCKS',
		uids,
		blocks,
	};
}

export function insertBlock( block, after ) {
	return insertBlocks( [ block ], after );
}

export function insertBlocks( blocks, after ) {
	return {
		type: 'INSERT_BLOCKS',
		blocks,
		after,
	};
}

export function showInsertionPoint() {
	return {
		type: 'SHOW_INSERTION_POINT',
	};
}

export function hideInsertionPoint() {
	return {
		type: 'HIDE_INSERTION_POINT',
	};
}

/**
 * Returns an action object used in signalling that the blocks
 * corresponding to the specified UID set are to be removed.
 *
 * @param  {String[]} uids Block UIDs
 * @return {Object}        Action object
 */
export function removeBlocks( uids ) {
	return {
		type: 'REMOVE_BLOCKS',
		uids,
	};
}

/**
 * Returns an action object used in signalling that the block with the
 * specified UID is to be removed.
 *
 * @param  {String} uid Block UID
 * @return {Object}     Action object
 */
export function removeBlock( uid ) {
	return removeBlocks( [ uid ] );
}

/**
 * Returns an action object used in signalling that the user has begun to type.
 *
 * @return {Object}     Action object
 */
export function startTyping() {
	return {
		type: 'START_TYPING',
	};
}

/**
 * Returns an action object used in signalling that the user has stopped typing.
 *
 * @return {Object}     Action object
 */
export function stopTyping() {
	return {
		type: 'STOP_TYPING',
	};
}

export function mergeBlocks( dispatch, blocks, blockTypes ) {
	const [ blockA, blockB ] = blocks;
	const blockType = find( blockTypes, ( bt ) => bt.name === blockA.name );
	const mergedBlockType = find( blockTypes, ( bt ) => bt.name === blockB.name );

	// Only focus the previous block if it's not mergeable
	if ( ! blockType.merge ) {
		dispatch( focusBlock( blockA.uid ) );
		return;
	}

	// We can only merge blocks with similar types
	// thus, we transform the block to merge first
	const blocksWithTheSameType = blockA.name === blockB.name
		? [ blockB ]
		: switchToBlockType( blockB, mergedBlockType, blockType );

	// If the block types can not match, do nothing
	if ( ! blocksWithTheSameType || ! blocksWithTheSameType.length ) {
		return;
	}

	// Calling the merge to update the attributes and remove the block to be merged
	const updatedAttributes = blockType.merge(
		blockA.attributes,
		blocksWithTheSameType[ 0 ].attributes
	);

	dispatch( focusBlock( blockA.uid, { offset: -1 } ) );
	dispatch( replaceBlocks(
		[ blockA.uid, blockB.uid ],
		[
			{
				...blockA,
				attributes: {
					...blockA.attributes,
					...updatedAttributes,
				},
			},
			...blocksWithTheSameType.slice( 1 ),
		]
	) );
}
