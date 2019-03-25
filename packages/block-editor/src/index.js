/**
 * WordPress dependencies
 */
import '@wordpress/blocks';
import '@wordpress/core-data';
import '@wordpress/rich-text';
import '@wordpress/viewport';

/**
 * Internal dependencies
 */
export { storeConfig } from './store';
import './hooks';

export * from './components';

export { SETTINGS_DEFAULTS } from './store/defaults';
