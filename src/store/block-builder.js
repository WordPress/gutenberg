/**
 * @format
 * @flow
 */

 import type { BlockType } from './';

const emptyBlock: BlockType = {
	isValid: true,
	attributes: {
		content: 'this is a new block',
	},
	innerBlocks: [],
	focused: false,
};

export function buildEmptyBlock(uid, name) {
	return {uid: uid, name: name, ...emptyBlock}
}
