/**
 * Internal dependencies
 */
import './style.scss';
export { init, initSinglePage } from './components/app';

// Hacks
// This ensures wp-editor is added as a dependency to the boot package.
/**
 * WordPress dependencies
 */
import '@wordpress/editor';
