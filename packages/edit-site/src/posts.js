/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import {
	registerCoreBlocks,
	__experimentalGetCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { dispatch } from '@wordpress/data';
import { createRoot, StrictMode } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	registerLegacyWidgetBlock,
	registerWidgetGroupBlock,
} from '@wordpress/widgets';

/**
 * Internal dependencies
 */
import './hooks';
import { store as editSiteStore } from './store';

/**
 * Internal dependencies
 */
import PostsApp from './components/posts-app';

/**
 * Initializes the "Posts Dashboard"
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Editor settings.
 */
export function initializePostsDashboard( id, settings ) {
	if ( ! globalThis.IS_GUTENBERG_PLUGIN ) {
		return;
	}
	const target = document.getElementById( id );
	const root = createRoot( target );

	dispatch( blocksStore ).reapplyBlockTypeFilters();
	const coreBlocks = __experimentalGetCoreBlocks().filter(
		( { name } ) => name !== 'core/freeform'
	);
	registerCoreBlocks( coreBlocks );
	dispatch( blocksStore ).setFreeformFallbackBlockName( 'core/html' );
	registerLegacyWidgetBlock( { inserter: false } );
	registerWidgetGroupBlock( { inserter: false } );
	if ( globalThis.IS_GUTENBERG_PLUGIN ) {
		__experimentalRegisterExperimentalCoreBlocks( {
			enableFSEBlocks: true,
		} );
	}

	// We dispatch actions and update the store synchronously before rendering
	// so that we won't trigger unnecessary re-renders with useEffect.
	dispatch( preferencesStore ).setDefaults( 'core/edit-site', {
		welcomeGuide: true,
		welcomeGuideStyles: true,
		welcomeGuidePage: true,
		welcomeGuideTemplate: true,
	} );

	dispatch( preferencesStore ).setDefaults( 'core', {
		allowRightClickOverrides: true,
		distractionFree: false,
		editorMode: 'visual',
		fixedToolbar: false,
		focusMode: false,
		inactivePanels: [],
		keepCaretInsideBlock: false,
		openPanels: [ 'post-status' ],
		showBlockBreadcrumbs: true,
		showListViewByDefault: false,
		enableChoosePatternModal: true,
	} );

	dispatch( editSiteStore ).updateSettings( settings );

	// Prevent the default browser action for files dropped outside of dropzones.
	window.addEventListener( 'dragover', ( e ) => e.preventDefault(), false );
	window.addEventListener( 'drop', ( e ) => e.preventDefault(), false );

	root.render(
		<StrictMode>
			<PostsApp />
		</StrictMode>
	);

	return root;
}
