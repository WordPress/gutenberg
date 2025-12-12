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
 * @param {string} id ID of the root element to render the screen in.
 */
export function initializeExperiments( id ) {
	if ( ! globalThis.IS_GUTENBERG_PLUGIN ) {
		return;
	}
	const target = document.getElementById( id );
	const root = createRoot( target );

	root.render(
		<StrictMode>
			<ExperimentsApp />
		</StrictMode>
	);

	return root;
}
