/**
 * @format
 * @flow
 */

import ActionTypes from './ActionTypes';
import type { BlockType } from '../';

export type BlockActionType = string => {
	type: $Values<typeof ActionTypes.BLOCK>,
	clientId: string,
};

export type CreateActionType = ( string, BlockType, string ) => {
	type: $Values<typeof ActionTypes.BLOCK>,
	clientId: string,
	block: BlockType,
	clientIdAbove: string,
};

export type ParseActionType = string => {
	type: $Values<typeof ActionTypes.BLOCK>,
	html: string,
};

export type serializeToNativeActionType = void => {
	type: $Values<typeof ActionTypes.BLOCK>,
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

export const createBlockAction: CreateActionType = ( clientId, block, clientIdAbove ) => ( {
	type: ActionTypes.BLOCK.CREATE,
	clientId,
	block: block,
	clientIdAbove,
} );

export const parseBlocksAction: ParseActionType = ( html ) => ( {
	type: ActionTypes.BLOCK.PARSE,
	html,
} );

export const serializeToNativeAction: serializeToNativeActionType = () => ( {
	type: ActionTypes.BLOCK.SERIALIZE_ALL,
} );
