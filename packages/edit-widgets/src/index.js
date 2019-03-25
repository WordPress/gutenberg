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
 * @param {string} target Selector for the root element to render the screen.
 */
export function initialize( target ) {
	registerCoreBlocks();
	render(
		<Layout />,
		document.querySelector( target )
	);
}
