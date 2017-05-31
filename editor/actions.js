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

export function setInsertionPoint( uid ) {
	return {
		type: 'SET_INSERTION_POINT',
		uid,
	};
}

export function clearInsertionPoint() {
	return {
		type: 'CLEAR_INSERTION_POINT',
	};
}

export function editPost( edits ) {
	return {
		type: 'EDIT_POST',
		edits,
	};
}

export function savePost( postId, edits ) {
	return {
		type: 'REQUEST_POST_UPDATE',
		edits,
		postId,
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
