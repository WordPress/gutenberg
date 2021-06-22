/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unstable__bootstrapServerSideBlockDefinitions, // eslint-disable-line camelcase
} from '@wordpress/blocks';
import { render } from '@wordpress/element';
import {
	registerCoreBlocks,
	__experimentalGetCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { __experimentalFetchLinkSuggestions as fetchLinkSuggestions } from '@wordpress/core-data';
import {
	registerLegacyWidgetBlock,
	registerLegacyWidgetVariations,
} from '@wordpress/widgets';

/**
 * Internal dependencies
 */
import './store';
import './filters';
import * as widgetArea from './blocks/widget-area';
import Layout from './components/layout';

const DISABLED_BLOCKS = [ 'core/more', 'core/freeform' ];
const ENABLE_EXPERIMENTAL_FSE_BLOCKS = false;

/**
 * Initializes the block editor in the widgets screen.
 *
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Block editor settings.
 */
export function initialize( id, settings ) {
	const coreBlocks = __experimentalGetCoreBlocks().filter( ( block ) => {
		return ! (
			DISABLED_BLOCKS.includes( block.name ) ||
			block.name.startsWith( 'core/post' ) ||
			block.name.startsWith( 'core/query' ) ||
			block.name.startsWith( 'core/site' )
		);
	} );

	registerCoreBlocks( coreBlocks );
	registerLegacyWidgetBlock();
	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks( {
			enableFSEBlocks: ENABLE_EXPERIMENTAL_FSE_BLOCKS,
		} );
	}
	registerLegacyWidgetVariations( settings );
	registerBlock( widgetArea );
	settings.__experimentalFetchLinkSuggestions = ( search, searchOptions ) =>
		fetchLinkSuggestions( search, searchOptions, settings );
	render(
		<Layout blockEditorSettings={ settings } />,
		document.getElementById( id )
	);
}

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
	if ( metadata ) {
		unstable__bootstrapServerSideBlockDefinitions( { [ name ]: metadata } );
	}
	registerBlockType( name, settings );
};
