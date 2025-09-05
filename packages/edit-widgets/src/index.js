/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unstable__bootstrapServerSideBlockDefinitions, // eslint-disable-line camelcase
	setFreeformContentHandlerName,
	store as blocksStore,
} from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { StrictMode, createRoot } from '@wordpress/element';
import {
	registerCoreBlocks,
	__experimentalGetCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { __experimentalFetchLinkSuggestions as fetchLinkSuggestions } from '@wordpress/core-data';
import {
	registerLegacyWidgetBlock,
	registerLegacyWidgetVariations,
	registerWidgetGroupBlock,
} from '@wordpress/widgets';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import './store';
import './filters';
import * as widgetArea from './blocks/widget-area';
import Layout from './components/layout';
import {
	ALLOW_REUSABLE_BLOCKS,
	ENABLE_EXPERIMENTAL_FSE_BLOCKS,
} from './constants';

const disabledBlocks = [
	'core/more',
	'core/freeform',
	'core/template-part',
	...( ALLOW_REUSABLE_BLOCKS ? [] : [ 'core/block' ] ),
];

/**
 * Initializes the block editor in the widgets screen.
 *
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Block editor settings.
 */
export function initializeEditor( id, settings ) {
	const target = document.getElementById( id );
	const root = createRoot( target );

	const coreBlocks = __experimentalGetCoreBlocks().filter( ( block ) => {
		return ! (
			disabledBlocks.includes( block.name ) ||
			block.name.startsWith( 'core/post' ) ||
			block.name.startsWith( 'core/query' ) ||
			block.name.startsWith( 'core/site' ) ||
			block.name.startsWith( 'core/navigation' )
		);
	} );

	dispatch( preferencesStore ).setDefaults( 'core/edit-widgets', {
		fixedToolbar: false,
		welcomeGuide: true,
		showBlockBreadcrumbs: true,
		themeStyles: true,
	} );

	dispatch( blocksStore ).reapplyBlockTypeFilters();
	registerCoreBlocks( coreBlocks );
	registerLegacyWidgetBlock();
	if ( globalThis.IS_GUTENBERG_PLUGIN ) {
		__experimentalRegisterExperimentalCoreBlocks( {
			enableFSEBlocks: ENABLE_EXPERIMENTAL_FSE_BLOCKS,
		} );
	}
	registerLegacyWidgetVariations( settings );
	registerBlock( widgetArea );
	registerWidgetGroupBlock();

	settings.__experimentalFetchLinkSuggestions = ( search, searchOptions ) =>
		fetchLinkSuggestions( search, searchOptions, settings );

	// As we are unregistering `core/freeform` to avoid the Classic block, we must
	// replace it with something as the default freeform content handler. Failure to
	// do this will result in errors in the default block parser.
	// see: https://github.com/WordPress/gutenberg/issues/33097
	setFreeformContentHandlerName( 'core/html' );

	root.render(
		<StrictMode>
			<Layout blockEditorSettings={ settings } />
		</StrictMode>
	);

	return root;
}

/**
 * Compatibility export under the old `initialize` name.
 */
export const initialize = initializeEditor;

export function reinitializeEditor() {
	deprecated( 'wp.editWidgets.reinitializeEditor', {
		since: '6.2',
		version: '6.3',
	} );
}

/**
 * Function to register an individual block.
 *
 * @param {Object} block The block to be registered.
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

export { store } from './store';
