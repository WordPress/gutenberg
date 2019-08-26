/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/block-editor';
import '@wordpress/editor';
import '@wordpress/viewport';
import '@wordpress/notices';
import { registerCoreBlocks } from '@wordpress/block-library';
import { unregisterBlockType } from '@wordpress/blocks';
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

	// disable Code block for the release
	// eslint-disable-next-line no-undef
	if ( typeof __DEV__ === 'undefined' || ! __DEV__ ) {
		unregisterBlockType( 'core/code' );
	}

	blocksRegistered = true;
}

export { default as Editor } from './editor';
