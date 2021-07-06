/**
 * Internal dependencies
 */
import './hooks';

export { storeConfig, store } from './store';
export * from './components';
export * from './utils';

// This module is exposed as window.wp.editor
// Problem: there is quite some code expecting another, legacy object available under window.wp.editor
// Solution: export all the members of legacy window.wp.editor from this new module to maintain backward compatibility
// For more context, see https://github.com/WordPress/gutenberg/issues/33203
export const {
	autop,
	removep,
	initialize,
	remove,
	getContent,
} = window?.wp?.oldEditor;

/*
 * Backward compatibility
 */
export { transformStyles } from '@wordpress/block-editor';
