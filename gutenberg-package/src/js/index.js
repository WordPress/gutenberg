/**
 * Internal dependencies
 */
import './wp-init.js';
import '../scss/theme.scss';
import '@wordpress/core-data';

/**
 * WordPress dependencies
 */
export { select, dispatch } from '@wordpress/data';
export { initializeEditor } from '@wordpress/edit-post';
export { registerBlockType } from '@wordpress/blocks';
export * from '@wordpress/editor';
