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
	return {
		type: 'INSERT_BLOCK',
		block,
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

export function editPost( edits ) {
	return {
		type: 'EDIT_POST',
		edits,
	};
}

export function savePost() {
	return {
		type: 'REQUEST_POST_UPDATE',
	};
}

export function trashPost( postId, postType ) {
	return {
		type: 'TRASH_POST',
		postId,
		postType,
	};
}

export function mergeBlocks( blockA, blockB ) {
	return {
		type: 'MERGE_BLOCKS',
		blocks: [ blockA, blockB ],
	};
}

/**
 * Returns an action object used in signalling that the user has begun to type
 * within a block's editable field.
 *
 * @param  {String} uid Block UID
 * @return {Object}     Action object
 */
export function startTypingInBlock( uid ) {
	return {
		type: 'START_TYPING',
		uid,
	};
}

/**
 * Returns an action object used in signalling that the user has stopped typing
 * within a block's editable field.
 *
 * @param  {String} uid Block UID
 * @return {Object}     Action object
 */
export function stopTypingInBlock( uid ) {
	return {
		type: 'STOP_TYPING',
		uid,
	};
}
