/**
 * WordPress dependencies
 */
import '@wordpress/block-editor';
import '@wordpress/core-data';
import '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import './hooks';

export { storeConfig, store } from './store';
export * from './components';
export * from './utils';

/*
 * Backward compatibility
 */
export { transformStyles } from '@wordpress/block-editor';
