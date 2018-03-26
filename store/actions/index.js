/** @format */
import ActionTypes from './ActionTypes';

export function updateBlockAttributes( uid, attributes ) {
	return {
		type: ActionTypes.BLOCK.UPDATE_ATTRIBUTES,
		uid,
		attributes,
	};
}

export const focusBlockAction = uid => ( {
	type: ActionTypes.BLOCK.FOCUS,
	uid: uid,
} );

export const moveBlockUpAction = uid => ( {
	type: ActionTypes.BLOCK.MOVE_UP,
	uid: uid,
} );

export const moveBlockDownAction = uid => ( {
	type: ActionTypes.BLOCK.MOVE_DOWN,
	uid: uid,
} );

export const deleteBlockAction = uid => ( {
	type: ActionTypes.BLOCK.DELETE,
	uid: uid,
} );
