/**
 * WordPress dependencies
 */
import '@wordpress/blocks';
import '@wordpress/rich-text';
import '@wordpress/viewport';
import '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import './hooks';
export * from './components';
export * from './utils';
export { storeConfig } from './store';
export { SETTINGS_DEFAULTS } from './store/defaults';
