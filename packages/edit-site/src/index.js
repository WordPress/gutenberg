/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { dispatch } from '@wordpress/data';
import { render, unmountComponentAtNode } from '@wordpress/element';
import {
	__experimentalFetchLinkSuggestions as fetchLinkSuggestions,
	__experimentalFetchUrlData as fetchUrlData,
} from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
import { addFilter } from '@wordpress/hooks';
import { registerLegacyWidgetBlock } from '@wordpress/widgets';

/**
 * Internal dependencies
 */
import './hooks';
import { store as editSiteStore } from './store';
import App from './components/app';

/**
 * Reinitializes the editor after the user chooses to reboot the editor after
 * an unhandled error occurs, replacing previously mounted editor element using
 * an initial state from prior to the crash.
 *
 * @param {Element} target   DOM node in which editor is rendered.
 * @param {?Object} settings Editor settings object.
 */
export function reinitializeEditor( target, settings ) {
	/*
	 * Prevent adding the Clasic block in the site editor.
	 * Only add the filter when the site editor is initialized, not imported.
	 * Also only add the filter(s) after registerCoreBlocks()
	 * so that common filters in the block library are not overwritten.
	 *
	 * This usage here is inspired by previous usage of the filter in the post editor:
	 * https://github.com/WordPress/gutenberg/pull/37157
	 */
	addFilter(
		'blockEditor.__unstableCanInsertBlockType',
		'removeClassicBlockFromInserter',
		( canInsert, blockType ) => {
			if ( blockType.name === 'core/freeform' ) {
				return false;
			}
			return canInsert;
		}
	);

	// This will be a no-op if the target doesn't have any React nodes.
	unmountComponentAtNode( target );
	const reboot = reinitializeEditor.bind( null, target, settings );

	// We dispatch actions and update the store synchronously before rendering
	// so that we won't trigger unnecessary re-renders with useEffect.
	{
		dispatch( preferencesStore ).setDefaults( 'core/edit-site', {
			editorMode: 'visual',
			fixedToolbar: false,
			focusMode: false,
			keepCaretInsideBlock: false,
			welcomeGuide: true,
			welcomeGuideStyles: true,
			showListViewByDefault: false,
		} );

		dispatch( interfaceStore ).setDefaultComplementaryArea(
			'core/edit-site',
			'edit-site/template'
		);

		dispatch( editSiteStore ).updateSettings( settings );

		// Keep the defaultTemplateTypes in the core/editor settings too,
		// so that they can be selected with core/editor selectors in any editor.
		// This is needed because edit-site doesn't initialize with EditorProvider,
		// which internally uses updateEditorSettings as well.
		dispatch( editorStore ).updateEditorSettings( {
			defaultTemplateTypes: settings.defaultTemplateTypes,
			defaultTemplatePartAreas: settings.defaultTemplatePartAreas,
		} );
	}

	// Prevent the default browser action for files dropped outside of dropzones.
	window.addEventListener( 'dragover', ( e ) => e.preventDefault(), false );
	window.addEventListener( 'drop', ( e ) => e.preventDefault(), false );

	render( <App reboot={ reboot } />, target );
}

/**
 * Initializes the site editor screen.
 *
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Editor settings.
 */
export function initializeEditor( id, settings ) {
	settings.__experimentalFetchLinkSuggestions = ( search, searchOptions ) =>
		fetchLinkSuggestions( search, searchOptions, settings );
	settings.__experimentalFetchRichUrlData = fetchUrlData;

	const target = document.getElementById( id );

	dispatch( blocksStore ).__experimentalReapplyBlockTypeFilters();
	registerCoreBlocks();
	registerLegacyWidgetBlock( { inserter: false } );
	if ( process.env.IS_GUTENBERG_PLUGIN ) {
		__experimentalRegisterExperimentalCoreBlocks( {
			enableFSEBlocks: true,
		} );
	}

	reinitializeEditor( target, settings );
}

export { default as PluginSidebar } from './components/sidebar-edit-mode/plugin-sidebar';
export { default as PluginSidebarMoreMenuItem } from './components/header-edit-mode/plugin-sidebar-more-menu-item';
export { default as PluginMoreMenuItem } from './components/header-edit-mode/plugin-more-menu-item';
