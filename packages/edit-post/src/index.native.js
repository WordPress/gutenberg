/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/block-editor';
import { UnsupportedBlock } from '@wordpress/editor';
import '@wordpress/notices';
import { registerCoreBlocks } from '@wordpress/block-library';
import { registerBlockType, setUnregisteredTypeHandlerName, unregisterBlockType } from '@wordpress/blocks';

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
	registerBlockType( UnsupportedBlock.name, UnsupportedBlock.settings );
	setUnregisteredTypeHandlerName( UnsupportedBlock.name );

	// disable Code and More blocks for the release
	// eslint-disable-next-line no-undef
	if ( typeof __DEV__ === 'undefined' || ! __DEV__ ) {
		unregisterBlockType( 'core/code' );
		unregisterBlockType( 'core/more' );
	}
}

