/**
 * @format
 * @flow
 */

import ActionTypes from './ActionTypes';

export type BlockActionType = string => {
	type: $Values<typeof ActionTypes.BLOCK>,
	uid: string,
};

export function updateBlockAttributes( uid: string, attributes: mixed ) {
	return {
		type: ActionTypes.BLOCK.UPDATE_ATTRIBUTES,
		uid,
		attributes,
	};
}

export const focusBlockAction: BlockActionType = uid => ( {
	type: ActionTypes.BLOCK.FOCUS,
	uid: uid,
} );

export const moveBlockUpAction: BlockActionType = uid => ( {
	type: ActionTypes.BLOCK.MOVE_UP,
	uid: uid,
} );

export const moveBlockDownAction: BlockActionType = uid => ( {
	type: ActionTypes.BLOCK.MOVE_DOWN,
	uid: uid,
} );

export const deleteBlockAction: BlockActionType = uid => ( {
	type: ActionTypes.BLOCK.DELETE,
	uid: uid,
} );

export const parseBlocksAction: BlockActionType = payload => ( {
	type: ActionTypes.BLOCK.PARSE,
	uid: '',
	payload: payload
} );
