/**
 * @format
 * @flow
 */

import ActionTypes from './ActionTypes';

export type BlockActionType = string => {
	type: $Values<typeof ActionTypes.BLOCK>,
	clientId: string,
};

export function updateBlockAttributes( clientId: string, attributes: mixed ) {
	return {
		type: ActionTypes.BLOCK.UPDATE_ATTRIBUTES,
		clientId,
		attributes,
	};
}

export const focusBlockAction: BlockActionType = ( clientId ) => ( {
	type: ActionTypes.BLOCK.FOCUS,
	clientId,
} );

export const moveBlockUpAction: BlockActionType = ( clientId ) => ( {
	type: ActionTypes.BLOCK.MOVE_UP,
	clientId,
} );

export const moveBlockDownAction: BlockActionType = ( clientId ) => ( {
	type: ActionTypes.BLOCK.MOVE_DOWN,
	clientId,
} );

export const deleteBlockAction: BlockActionType = ( clientId ) => ( {
	type: ActionTypes.BLOCK.DELETE,
	clientId,
} );
