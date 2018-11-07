/**
 * @format
 * @flow
 */

export type BlockType = {
	clientId: string,
	name: string,
	isValid: boolean,
	attributes: Object,
	innerBlocks: Array<BlockType>,
	focused: boolean,
};

export type StateType = {
	blocks: Array<BlockType>,
	initialHtmlHash: string,
	refresh: boolean,
	fullparse: boolean,
};
