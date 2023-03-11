/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import App from './components/app';

/**
 * Initializes the onboarding screen.
 *
 * @param {string} id ID of the root element to render the screen in.
 */
export function initialize( id ) {
	const target = document.getElementById( id );
	const root = createRoot( target );

	// Prevent the default browser action for files dropped outside of dropzones.
	window.addEventListener( 'dragover', ( e ) => e.preventDefault(), false );
	window.addEventListener( 'drop', ( e ) => e.preventDefault(), false );

	root.render( <App /> );
	return root;
}
