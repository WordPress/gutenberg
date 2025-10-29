/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Router from './router';
import { STORE_NAME } from '../../store';
import type { MenuItem } from '../../store/types';

function App() {
	return <Router />;
}

export async function init( menuItems: MenuItem[] ) {
	// Import the store to ensure it's registered
	await import( '../../store' );

	// Register menu items
	menuItems.forEach( ( menuItem ) => {
		// @ts-ignore
		dispatch( STORE_NAME ).registerMenuItem( menuItem.id, menuItem );
	} );

	// Render the app
	const rootElement = document.getElementById( 'gutenberg-boot-app' );
	if ( rootElement ) {
		const root = createRoot( rootElement );
		root.render( <App /> );
	}
}
