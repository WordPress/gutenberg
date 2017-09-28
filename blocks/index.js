/**
 * WordPress dependencies
 */
export {
	source,
	createBlock,
	switchToBlockType,
	parse,
	pasteHandler,
	serialize,
	getBlockDefaultClassname,
	getCategories,
	unregisterBlockType,
	setUnknownTypeHandlerName,
	getUnknownTypeHandlerName,
	setDefaultBlockName,
	getDefaultBlockName,
	getBlockType,
	getBlockTypes,
	AlignmentToolbar,
	BlockAlignmentToolbar,
	BlockControls,
	BlockDescription,
	BlockIcon,
	ColorPalette,
	Editable,
	InspectorControls,
	MediaUploadButton,
	UrlInput,
	UrlInputButton,
} from '@wordpress/editor';

import { registerBlockType as oldRegisterBlockType } from '@wordpress/editor';

const wrapWithDeprecationWarning = ( func ) => function() {
	console.warn( // eslint-disable-line no-console
		'The "wp.blocks" module has been deprecated and replaced by "wp.editor". please update your usage.' +
		' Example: wp.editor.registerBlock instead of wp.blocks.registerBlock'
	);
	return func( ...arguments );
};

export const registerBlockType = wrapWithDeprecationWarning( oldRegisterBlockType );
