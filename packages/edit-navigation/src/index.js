/**
 * WordPress dependencies
 */
import {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { render, useMemo } from '@wordpress/element';
import { __experimentalFetchLinkSuggestions as fetchLinkSuggestions } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editNavigationStore } from './store';
import { addFilters } from './filters';
import Layout from './components/layout';

function NavEditor( { settings } ) {
	const { setIsInserterOpened } = useDispatch( editNavigationStore );

	// Allows the QuickInserter to toggle the sidebar inserter.
	// This is marked as experimental to give time for the quick inserter to mature.
	const __experimentalSetIsInserterOpened = setIsInserterOpened;

	// Provide link suggestions handler to fetch search results for Link UI.
	const __experimentalFetchLinkSuggestions = ( search, searchOptions ) => {
		// Bump the default number of suggestions.
		// See https://github.com/WordPress/gutenberg/issues/34283.
		searchOptions.perPage = 10;
		return fetchLinkSuggestions( search, searchOptions, settings );
	};

	const editorSettings = useMemo( () => {
		return {
			...settings,
			__experimentalFetchLinkSuggestions,
			__experimentalSetIsInserterOpened,
		};
	}, [
		settings,
		__experimentalFetchLinkSuggestions,
		__experimentalSetIsInserterOpened,
	] );

	return <Layout blockEditorSettings={ editorSettings } />;
}

/**
 * Setup and registration of editor.
 *
 * @param {Object} settings blockEditor settings.
 */
function setUpEditor( settings ) {
	addFilters( ! settings.blockNavMenus );
	registerCoreBlocks();

	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks();
	}
}

/**
 * Initalise and render editor into DOM.
 *
 * @param {string} id       ID of HTML element into which the editor will be rendered.
 * @param {Object} settings blockEditor settings.
 */
export function initialize( id, settings ) {
	setUpEditor( settings );

	render(
		<NavEditor settings={ settings } />,
		document.getElementById( id )
	);
}
