/**
 * WordPress dependencies
 */
import { __experimentalRegisterExperimentalCoreBlocks } from '@wordpress/block-library';
import { unregisterBlockType } from '@wordpress/blocks';
import { render } from '@wordpress/element';
import { __experimentalFetchLinkSuggestions as fetchLinkSuggestions } from '@wordpress/core-data';

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
	// registerCoreBlocks();

	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks();
		unregisterBlockType( 'core/navigation' );
	}

	settings.__experimentalFetchLinkSuggestions = ( search, searchOptions ) =>
		fetchLinkSuggestions( search, searchOptions, settings );

	render(
		<Layout blockEditorSettings={ settings } />,
		document.getElementById( id )
	);
}
