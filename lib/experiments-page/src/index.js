/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ExperimentsPage from './experiments-page';
import './style.scss';

// Initialize the experiments page when DOM is ready.
document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById( 'gutenberg-experiments-root' );
	if ( container ) {
		const root = createRoot( container );
		root.render( <ExperimentsPage /> );
	}
} );
