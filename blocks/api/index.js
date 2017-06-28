/**
 * External dependencies
 */
import * as query from './query';

export { query };
export { createBlock, switchToBlockType } from './factory';
export { default as parse } from './parser';
export { default as serialize, getBlockDefaultClassname } from './serializer';
export { getCategories } from './categories';
export {
	registerBlockType,
	unregisterBlockType,
	setUnknownTypeHandler,
	getUnknownTypeHandler,
	setDefaultBlock,
	getDefaultBlock,
	getBlockType,
	getBlockTypes,
} from './registration';
