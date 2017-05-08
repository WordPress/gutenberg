/**
 * External dependencies
 */
export { default as query } from './query';
export { createBlock, switchToBlockType } from './factory';
export { default as parse } from './parser';
export { default as serialize } from './serializer';
export { getCategories } from './categories';
export {
	registerBlock,
	unregisterBlock,
	setUnknownTypeHandler,
	getUnknownTypeHandler,
	getBlockSettings,
	getBlocks
} from './registration';
