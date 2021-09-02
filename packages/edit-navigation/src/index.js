/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { render } from '@wordpress/element';
import { __experimentalFetchLinkSuggestions as fetchLinkSuggestions } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import * as menuBlock from './blocks/menu';
import * as menuItemBlock from './blocks/menu-item';
import { addFilters } from './filters';

/**
 * Internal dependencies
 */
import Layout from './components/layout';
import './store';

/**
 * Function to register an individual block.
 *
 * @param {Object} block The block to be registered.
 *
 */
const registerBlock = ( block ) => {
	if ( ! block ) {
		return;
	}
	const { metadata, settings, name } = block;
	registerBlockType( { name, ...metadata }, settings );
};

export function initialize( id, settings ) {
	addFilters();

	registerBlock( menuBlock );
	registerBlock( menuItemBlock );

	// Required for wp-nav-menus theme opt-in.
	// registerCoreBlocks();
	//
	// if ( process.env.GUTENBERG_PHASE === 2 ) {
	// 	__experimentalRegisterExperimentalCoreBlocks();
	// }

	settings.__experimentalFetchLinkSuggestions = ( search, searchOptions ) =>
		fetchLinkSuggestions( search, searchOptions, settings );

	render(
		<Layout blockEditorSettings={ settings } />,
		document.getElementById( id )
	);
}
