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
import deprecated from '@wordpress/deprecated';
import { createRoot, StrictMode } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
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
import { unlock } from './lock-unlock';
import App from './components/app';

const { registerCoreBlockBindingsSources } = unlock( editorPrivateApis );

/**
 * Initializes the site editor screen.
 *
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Editor settings.
 */
export function initializeEditor( id, settings ) {
	const target = document.getElementById( id );
	const root = createRoot( target );

	dispatch( blocksStore ).reapplyBlockTypeFilters();
	const coreBlocks = __experimentalGetCoreBlocks().filter(
		( { name } ) => name !== 'core/freeform'
	);
	registerCoreBlocks( coreBlocks );
	registerCoreBlockBindingsSources();
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
		editorTool: 'edit',
		fixedToolbar: false,
		focusMode: false,
		inactivePanels: [],
		keepCaretInsideBlock: false,
		openPanels: [ 'post-status' ],
		showBlockBreadcrumbs: true,
		showListViewByDefault: false,
		enableChoosePatternModal: true,
	} );

	if ( window.__experimentalMediaProcessing ) {
		dispatch( preferencesStore ).setDefaults( 'core/media', {
			requireApproval: true,
			optimizeOnUpload: true,
		} );
	}

	dispatch( editSiteStore ).updateSettings( settings );

	// Prevent the default browser action for files dropped outside of dropzones.
	window.addEventListener( 'dragover', ( e ) => e.preventDefault(), false );
	window.addEventListener( 'drop', ( e ) => e.preventDefault(), false );

	root.render(
		<StrictMode>
			<App />
		</StrictMode>
	);

	return root;
}

export function reinitializeEditor() {
	deprecated( 'wp.editSite.reinitializeEditor', {
		since: '6.2',
		version: '6.3',
	} );
}

export { default as PluginTemplateSettingPanel } from './components/plugin-template-setting-panel';
export { store } from './store';
export * from './deprecated';

// Temporary: While the posts dashboard is being iterated on
// it's being built in the same package as the site editor.
export { initializePostsDashboard } from './posts';
