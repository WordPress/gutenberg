/**
 * WordPress dependencies
 */
import { createRoot, StrictMode, type ComponentType } from '@wordpress/element';
import { dispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Router from './router';
import RootSinglePage from '../root/single-page';
import { store } from '../../store';
import type { MenuItem, Route } from '../../store/types';

function App( { rootComponent }: { rootComponent?: ComponentType } ) {
	const routes = useSelect( ( select ) => select( store ).getRoutes(), [] );

	return <Router routes={ routes } rootComponent={ rootComponent } />;
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

export async function initSinglePage( {
	mountId,
	routes,
}: {
	mountId: string;
	routes?: Route[];
} ) {
	( routes ?? [] ).forEach( ( route ) => {
		dispatch( store ).registerRoute( route );
	} );

	// Render the app without sidebar
	const rootElement = document.getElementById( mountId );
	if ( rootElement ) {
		const root = createRoot( rootElement );
		root.render(
			<StrictMode>
				<App rootComponent={ RootSinglePage } />
			</StrictMode>
		);
	}
}
