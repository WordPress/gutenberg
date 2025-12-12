/**
 * WordPress dependencies
 */
import { createRoot, StrictMode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ExperimentsApp from './components/experiments-app';

/**
 * Initializes the "Experiments Dashboard"
 * @param {string} id          ID of the root element to render the screen in.
 * @param {Array}  experiments Array of experiment definitions from PHP.
 */
export function initializeExperiments( id, experiments ) {
	if ( ! globalThis.IS_GUTENBERG_PLUGIN ) {
		return;
	}
	const target = document.getElementById( id );
	const root = createRoot( target );

	root.render(
		<StrictMode>
			<ExperimentsApp experiments={ experiments } />
		</StrictMode>
	);

	return root;
}
