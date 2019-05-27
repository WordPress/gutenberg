/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/notices';
import { registerCoreBlocks } from '@wordpress/block-library';
import { unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './store';

/**
 * Initializes the Editor.
 */
export function initializeEditor() {
	// register and setup blocks
	registerCoreBlocks();

	// disable Code and More blocks for the release
	// eslint-disable-next-line no-undef
	if ( typeof __DEV__ === 'undefined' || ! __DEV__ ) {
		unregisterBlockType( 'core/code' );
		unregisterBlockType( 'core/more' );
	}
}

