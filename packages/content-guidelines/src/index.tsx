/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AdminPage from './components/admin-page';
import './style.scss';

// Render admin page when DOM is ready.
domReady( () => {
	const container = document.getElementById( 'content-guidelines-admin' );
	if ( container ) {
		const root = createRoot( container );
		root.render( <AdminPage /> );
	}
} );

// Export store for external use.
export { store } from './store';
