/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import './store';
import EditWidgetsInitializer from './components/edit-widgets-initializer';

/**
 * Initilizes the widgets screen
 *
 * @param {string} id       Id of the root element to render the screen.
 * @param {Object} settings Id of the root element to render the screen.
 */
export function initialize( id, settings ) {
	registerCoreBlocks();
	render(
		<EditWidgetsInitializer
			settings={ settings }
		/>,
		document.getElementById( id )
	);
}
