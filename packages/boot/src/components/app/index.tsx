/**
 * WordPress dependencies
 */
import { createRoot, StrictMode } from '@wordpress/element';
import { dispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Router from './router';
import { store } from '../../store';
import type { MenuItem, Route } from '../../store/types';

function App() {
	const routes = useSelect( ( select ) => select( store ).getRoutes(), [] );

	return <Router routes={ routes } />;
}

export async function init( {
	mountId,
	menuItems,
	routes,
}: {
	mountId: string;
	menuItems?: MenuItem[];
	routes?: Route[];
} ) {
	( menuItems ?? [] ).forEach( ( menuItem ) => {
		dispatch( store ).registerMenuItem( menuItem.id, menuItem );
	} );

	( routes ?? [] ).forEach( ( route ) => {
		dispatch( store ).registerRoute( route );
	} );

	// Render the app
	const rootElement = document.getElementById( mountId );
	if ( rootElement ) {
		const root = createRoot( rootElement );
		root.render(
			<StrictMode>
				<App />
			</StrictMode>
		);
	}
}
