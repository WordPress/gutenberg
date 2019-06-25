/**
 * External dependencies
 */
import { Platform } from 'react-native';

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

export { default as VisualEditor } from './components/visual-editor';

/**
 * Initializes the Editor.
 */
export function initializeEditor() {
	// register and setup blocks
	registerCoreBlocks();

	// disable Code block for the release
	// eslint-disable-next-line no-undef
	if ( typeof __DEV__ === 'undefined' || ! __DEV__ ) {
		unregisterBlockType( 'core/code' );

		// Disable Video block except for iOS for now.
		if ( Platform.OS !== 'ios' ) {
			unregisterBlockType( 'core/video' );
		}
	}
}

