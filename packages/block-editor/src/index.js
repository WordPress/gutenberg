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
import './store';
import './hooks';
import { SETTINGS_DEFAULTS } from './store/defaults';

export * from './components';
export { SETTINGS_DEFAULTS };
