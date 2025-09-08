/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { createRoot, StrictMode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './hooks';
import { store as editSiteStore } from './store';

/**
 * Internal dependencies
 */
import ExperimentsApp from './components/experiments-app';

/**
 * Initializes the "Posts Dashboard"
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Editor settings.
 */
export function initializeExperiments( id, settings ) {
	if ( ! globalThis.IS_GUTENBERG_PLUGIN ) {
		return;
	}
	const target = document.getElementById( id );
	const root = createRoot( target );

	dispatch( editSiteStore ).updateSettings( settings );

	root.render(
		<StrictMode>
			<ExperimentsApp />
		</StrictMode>
	);

	return root;
}
