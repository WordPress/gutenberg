/**
 * WordPress dependencies
 */
import '@wordpress/block-editor';
import '@wordpress/blocks';
import '@wordpress/core-data';
import '@wordpress/keyboard-shortcuts';
import '@wordpress/notices';
import '@wordpress/rich-text';
import '@wordpress/viewport';

/**
 * Internal dependencies
 */
import './store';
import './hooks';

export * from './components';
export * from './utils';
export { storeConfig } from './store';

/*
 * Backward compatibility
 */
export { transformStyles } from '@wordpress/block-editor';
