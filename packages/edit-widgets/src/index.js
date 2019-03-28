/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import Layout from './components/layout';

/**
 * Initilizes the widgets screen
 *
 * @param {string} id Id of the root element to render the screen.
 */
export function initialize( id ) {
	registerCoreBlocks();
	render(
		<Layout />,
		document.getElementById( id )
	);
}
