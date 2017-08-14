/**
 * External dependencies
 */
import * as source from './source';

export { source };
export { createBlock, switchToBlockType } from './factory';
export { default as parse } from './parser';
export { default as pasteHandler } from './paste';
export { default as serialize, getBlockDefaultClassname } from './serializer';
export { getCategories } from './categories';
export {
	registerBlockType,
	unregisterBlockType,
	setUnknownTypeHandlerName,
	getUnknownTypeHandlerName,
	setDefaultBlock,
	getDefaultBlock,
	getBlockType,
	getBlockTypes,
} from './registration';
