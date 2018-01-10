/**
 * Internal dependencies
 */
import './hooks';
import './library';

// A "block" is the abstract term used to describe units of markup that,
// when composed together, form the content or layout of a page.
// The API for blocks is exposed via `wp.blocks`.
//
// Supported blocks are registered by calling `registerBlockType`. Once registered,
// the block is made available as an option to the editor interface.
//
// Blocks are inferred from the HTML source of a post through a parsing mechanism
// and then stored as objects in state, from which it is then rendered for editing.
export * from './api';
export { default as AlignmentToolbar } from './alignment-toolbar';
export { default as BlockAlignmentToolbar } from './block-alignment-toolbar';
export { default as BlockControls } from './block-controls';
export { default as BlockDescription } from './block-description';
export { default as BlockEdit } from './block-edit';
export { default as BlockIcon } from './block-icon';
export { default as ColorPalette } from './color-palette';
export { default as Editable } from './editable';
export { default as EditableProvider } from './editable/provider';
export { default as InspectorControls } from './inspector-controls';
export { default as MediaUploadButton } from './media-upload-button';
export { default as TermTreeSelect } from './term-tree-select';
export { default as UrlInput } from './url-input';
export { default as UrlInputButton } from './url-input/button';

// Deprecated matchers
import { attr, prop, text, html, query, node, children } from './hooks/matchers';
export const source = { attr, prop, text, html, query, node, children };
