/**
 * WordPress dependencies
 */
import {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { render } from '@wordpress/element';
import { __experimentalFetchLinkSuggestions as fetchLinkSuggestions } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import './plugins';
import './hooks';
import './store';
import Editor from './components/editor';

/**
 * Initializes the site editor screen.
 *
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Editor settings.
 */
export function initialize( id, settings ) {
	settings.__experimentalFetchLinkSuggestions = ( search, searchOptions ) =>
		fetchLinkSuggestions( search, searchOptions, settings );
	settings.__experimentalSpotlightEntityBlocks = [ 'core/template-part' ];

	registerCoreBlocks();
	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks( {
			enableFSEBlocks: true,
		} );
	}

	render(
		<Editor initialSettings={ settings } />,
		document.getElementById( id )
	);
}

export { default as __experimentalMainDashboardButton } from './components/main-dashboard-button';
export { default as __experimentalNavigationToggle } from './components/navigation-sidebar/navigation-toggle';
