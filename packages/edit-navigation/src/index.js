/**
 * WordPress dependencies
 */
import {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { render } from '@wordpress/element';
import { __experimentalFetchLinkSuggestions as fetchLinkSuggestions } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { addFilters } from './filters';

/**
 * Internal dependencies
 */
import Layout from './components/layout';
import './store';

export function initialize( id, settings ) {
	addFilters( ! settings.blockNavMenus );
	registerCoreBlocks();

	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks();
	}

	settings.__experimentalFetchLinkSuggestions = (
		searchText,
		searchOptions
	) => fetchLinkSuggestions( searchText, searchOptions, settings );

	render(
		<Layout blockEditorSettings={ settings } />,
		document.getElementById( id )
	);
}
