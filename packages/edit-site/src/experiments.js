/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { createRoot, StrictMode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ExperimentsApp from './components/experiments-app';
import { store as editSiteStore } from './store';

/**
 * Initializes the "Experiments Dashboard"
 * @param {string} id          ID of the root element to render the screen in.
 * @param {Object} settings    Editor settings.
 * @param {Array}  experiments Array of experiment definitions from PHP.
 */
export function initializeExperiments( id, settings, experiments ) {
	if ( ! globalThis.IS_GUTENBERG_PLUGIN ) {
		return;
	}
	const target = document.getElementById( id );
	const root = createRoot( target );

	dispatch( editSiteStore ).updateSettings( settings );

	root.render(
		<StrictMode>
			<ExperimentsApp experiments={ experiments } />
		</StrictMode>
	);

	return root;
}
