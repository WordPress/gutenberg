/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/block-editor';
import '@wordpress/viewport';
import '@wordpress/notices';
import { registerCoreBlocks } from '@wordpress/block-library';
import '@wordpress/format-library';
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './store';
import Editor from './editor';

let blocksRegistered = false;

/**
 * Initializes the Editor and returns a componentProvider
 * that can be registered with `AppRegistry.registerComponent`
 */
export function initializeEditor( {
	id,
	initialHtml,
	initialTitle,
	initialHtmlModeEnabled,
	postType,
} ) {
	if ( blocksRegistered ) {
		return;
	}

	// register and setup blocks
	registerCoreBlocks();
	blocksRegistered = true;

	render(
		<Editor
			initialHtml={ initialHtml }
			initialHtmlModeEnabled={ initialHtmlModeEnabled }
			initialTitle={ initialTitle }
			postType={ postType }
		/>,
		id
	);
}
