/**
 * WordPress dependencies
 */
import { createRoot, StrictMode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ExperimentsPage from './experiments-page';
import './style.scss';

/**
 * Initializes the Experiments page.
 *
 * @param {string} id          ID of the root element to render in.
 * @param {Array}  experiments Array of experiment definitions from PHP.
 * @return {Object|undefined} The React root instance, or undefined if initialization failed.
 */
export function initializeExperiments( id, experiments ) {
	const target = document.getElementById( id );
	if ( ! target ) {
		// eslint-disable-next-line no-console
		console.error(
			`Experiments page: Could not find element with id "${ id }"`
		);
		return;
	}

	if ( ! experiments || ! Array.isArray( experiments ) ) {
		// eslint-disable-next-line no-console
		console.error(
			'Experiments page: Invalid experiments data provided'
		);
		return;
	}

	const root = createRoot( target );

	root.render(
		<StrictMode>
			<ExperimentsPage experiments={ experiments } />
		</StrictMode>
	);

	return root;
}

// Expose to window for PHP initialization.
window.gutenbergExperimentsPage = {
	initializeExperiments,
};
