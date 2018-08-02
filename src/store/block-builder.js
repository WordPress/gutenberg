/**
 * @format
 * @flow
 */

import type { BlockType } from './';

export function buildEmptyBlock(uid: string, name: string) : BlockType {
	let emptyBlock = {	
		isValid: true,
		attributes: {
			content: 'this is a new block',
		},
		innerBlocks: [],
		focused: false,
	}
	return {uid: uid, name: name, ...emptyBlock}
}
