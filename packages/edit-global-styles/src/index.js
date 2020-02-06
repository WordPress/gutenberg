/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import EditGlobalStylesInitializer from './components/edit-global-styles-initializer';

/**
 * Initializes the global styles screen.
 *
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Global styles settings.
 */
export function initialize( id, settings ) {
	render(
		<EditGlobalStylesInitializer settings={ settings } />,
		document.getElementById( id )
	);
}
