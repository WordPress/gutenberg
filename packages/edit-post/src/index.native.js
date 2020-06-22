/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/block-editor';
import '@wordpress/editor';
import '@wordpress/viewport';
import '@wordpress/notices';
import { registerCoreBlocks } from '@wordpress/block-library';
import '@wordpress/format-library';

/**
 * Internal dependencies
 */
import './store';

let blocksRegistered = false;

/**
 * Initializes the Editor.
 */
export function initializeEditor() {
	if ( blocksRegistered ) {
		return;
	}

	// register and setup blocks
	registerCoreBlocks();
	blocksRegistered = true;
}

export { default as Editor } from './editor';
