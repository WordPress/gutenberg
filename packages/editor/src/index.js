/**
 * Internal dependencies
 */
import './hooks';

export { storeConfig, store } from './store';
export * from './components';
export * from './utils';

export const {
	autop,
	removep,
	initialize,
	remove,
	getContent,
} = window.wp.oldEditor;

/*
 * Backward compatibility
 */
export { transformStyles } from '@wordpress/block-editor';
