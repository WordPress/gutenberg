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

// Render admin page when DOM is ready (wp-admin context).
domReady( () => {
	const container = document.getElementById( 'content-guidelines-admin' );
	if ( container ) {
		const root = createRoot( container );
		root.render( <AdminPage /> );
	}
} );

// Export store for external use.
export { store } from './store';

// Export components for use by the admin page (built separately).
export { default as ActionsSection } from './components/actions-section';
export { default as RevisionHistoryScreen } from './components/revision-history-screen';
export { default as ScreenHeader } from './components/screen-header';
export {
	NavigationButtonAsItem,
	SummaryNavigationButton,
} from './components/navigation-button';
