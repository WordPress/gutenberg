/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import deprecated from '@wordpress/deprecated';
import { createRoot, StrictMode } from '@wordpress/element';
import { dispatch, resolveSelect, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	registerLegacyWidgetBlock,
	registerWidgetGroupBlock,
} from '@wordpress/widgets';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import Layout from './components/layout';
import { unlock } from './lock-unlock';

const {
	BackButton: __experimentalMainDashboardButton,
	registerCoreBlockBindingsSources,
} = unlock( editorPrivateApis );

/**
 * Initializes and returns an instance of Editor.
 *
 * @param {string}  id           Unique identifier for editor instance.
 * @param {string}  postType     Post type of the post to edit.
 * @param {Object}  postId       ID of the post to edit.
 * @param {?Object} settings     Editor settings object.
 * @param {Object}  initialEdits Programmatic edits to apply initially, to be
 *                               considered as non-user-initiated (bypass for
 *                               unsaved changes prompt).
 */
export function initializeEditor(
	id,
	postType,
	postId,
	settings,
	initialEdits
) {
	const isMediumOrBigger = window.matchMedia( '(min-width: 782px)' ).matches;
	const target = document.getElementById( id );
	const root = createRoot( target );

	dispatch( preferencesStore ).setDefaults( 'core/edit-post', {
		fullscreenMode: true,
		themeStyles: true,
		welcomeGuide: true,
		welcomeGuideTemplate: true,
	} );

	dispatch( preferencesStore ).setDefaults( 'core', {
		allowRightClickOverrides: true,
		editorMode: 'visual',
		editorTool: 'edit',
		fixedToolbar: false,
		hiddenBlockTypes: [],
		inactivePanels: [],
		openPanels: [ 'post-status' ],
		showBlockBreadcrumbs: true,
		showIconLabels: false,
		showListViewByDefault: false,
		enableChoosePatternModal: true,
		isPublishSidebarEnabled: true,
		showCollaborationCursor: false,
		showCollaborationNotifications: true,
	} );

	if ( window.__clientSideMediaProcessing ) {
		dispatch( preferencesStore ).setDefaults( 'core/media', {
			requireApproval: true,
			optimizeOnUpload: true,
		} );
	}

	dispatch( blocksStore ).reapplyBlockTypeFilters();

	// Check if the block list view should be open by default.
	// If `distractionFree` mode is enabled, the block list view should not be open.
	// This behavior is disabled for small viewports.
	if (
		isMediumOrBigger &&
		select( preferencesStore ).get( 'core', 'showListViewByDefault' ) &&
		! select( preferencesStore ).get( 'core', 'distractionFree' )
	) {
		dispatch( editorStore ).setIsListViewOpened( true );
	}

	registerCoreBlocks();
	registerCoreBlockBindingsSources();
	registerLegacyWidgetBlock( { inserter: false } );
	registerWidgetGroupBlock( { inserter: false } );
	if ( globalThis.IS_GUTENBERG_PLUGIN ) {
		__experimentalRegisterExperimentalCoreBlocks( {
			enableFSEBlocks: settings.__unstableEnableFullSiteEditingBlocks,
		} );
	}

	// Show a console log warning if the browser is not in Standards rendering mode.
	const documentMode =
		document.compatMode === 'CSS1Compat' ? 'Standards' : 'Quirks';
	if ( documentMode !== 'Standards' ) {
		// eslint-disable-next-line no-console
		console.warn(
			"Your browser is using Quirks Mode. \nThis can cause rendering issues such as blocks overlaying meta boxes in the editor. Quirks Mode can be triggered by PHP errors or HTML code appearing before the opening <!DOCTYPE html>. Try checking the raw page source or your site's PHP error log and resolving errors there, removing any HTML before the doctype, or disabling plugins."
		);
	}

	// This is a temporary fix for a couple of issues specific to Webkit on iOS.
	// Without this hack the browser scrolls the mobile toolbar off-screen.
	// Once supported in Safari we can replace this in favor of preventScroll.
	// For details see issue #18632 and PR #18686
	// Specifically, we scroll `interface-interface-skeleton__body` to enable a fixed top toolbar.
	// But Mobile Safari forces the `html` element to scroll upwards, hiding the toolbar.

	const isIphone = window.navigator.userAgent.indexOf( 'iPhone' ) !== -1;
	if ( isIphone ) {
		window.addEventListener( 'scroll', ( event ) => {
			const editorScrollContainer = document.getElementsByClassName(
				'interface-interface-skeleton__body'
			)[ 0 ];
			if ( event.target === document ) {
				// Scroll element into view by scrolling the editor container by the same amount
				// that Mobile Safari tried to scroll the html element upwards.
				if ( window.scrollY > 100 ) {
					editorScrollContainer.scrollTop =
						editorScrollContainer.scrollTop + window.scrollY;
				}
				// Undo unwanted scroll on html element, but only in the visual editor.
				if (
					document.getElementsByClassName( 'is-mode-visual' )[ 0 ]
				) {
					window.scrollTo( 0, 0 );
				}
			}
		} );
	}

	// Prevent the default browser action for files dropped outside of dropzones.
	window.addEventListener( 'dragover', ( e ) => e.preventDefault(), false );
	window.addEventListener( 'drop', ( e ) => e.preventDefault(), false );

	// Kick off the resolvers whose data the existing path-based
	// createPreloadingMiddleware already has cached. They run end-to-end
	// (start/receive/finish dispatches + downstream `resolveSelect` chains
	// + side-effects like priming canUser via the Allow header) against
	// the cached responses in a single batch before React mounts. By the
	// time `root.render(...)` runs, every metadata entry these touch is
	// already `finished`, so useSelect on the first render finds resolved
	// data and never triggers another `setTimeout(0)` resolution dance.
	const preloadedResolutions = preloadResolutions( postType, postId );

	preloadedResolutions.finally( () => {
		root.render(
			<StrictMode>
				<Layout
					settings={ settings }
					postId={ postId }
					postType={ postType }
					initialEdits={ initialEdits }
				/>
			</StrictMode>
		);
	} );

	return root;
}

/**
 * Drive each resolver to completion using the data already cached by
 * `createPreloadingMiddleware`. The middleware short-circuits apiFetch,
 * so no resolver issues a network request; we just need them to run
 * their dispatch cycles before React mounts.
 *
 * @param {string} postType Current post type.
 * @param {number} postId   Current post id.
 * @return {Promise<void>}  Resolves when the kickoff resolvers settle.
 */
function preloadResolutions( postType, postId ) {
	const core = resolveSelect( coreDataStore );
	return Promise.all( [
		core.getCurrentUser(),
		core.getEntitiesConfig( 'postType' ),
		core.getEntitiesConfig( 'taxonomy' ),
		core.getEntitiesConfig( 'root' ),
		core.getCurrentTheme(),
		core.getBlockPatternCategories(),
		core.__experimentalGetCurrentGlobalStylesId(),
		core.__experimentalGetCurrentThemeBaseGlobalStyles(),
		core.__experimentalGetCurrentThemeGlobalStylesVariations(),
		core.getEntityRecord( 'root', '__unstableBase' ),
		core.getEntityRecord( 'root', 'site' ),
		core.canUser( 'read', { kind: 'root', name: 'site' } ),
		core.canUser( 'create', { kind: 'postType', name: 'attachment' } ),
		core.canUser( 'create', { kind: 'postType', name: 'page' } ),
		core.canUser( 'create', { kind: 'postType', name: 'wp_block' } ),
		core.canUser( 'create', { kind: 'postType', name: 'wp_template' } ),
		// Per-post resolvers — only useful when we actually have a post.
		...( postType && postId
			? [
					core.getEntityRecord( 'root', 'postType', postType ),
					core.getEntityRecord( 'postType', postType, postId ),
					core.getAutosaves( postType, postId ),
			  ]
			: [] ),
	] ).catch( () => {
		// Any individual resolver failing here is harmless — the editor
		// would have hit the same failure on demand. Don't block render.
	} );
}

/**
 * Used to reinitialize the editor after an error. Now it's a deprecated noop function.
 */
export function reinitializeEditor() {
	deprecated( 'wp.editPost.reinitializeEditor', {
		since: '6.2',
		version: '6.3',
	} );
}

export { default as __experimentalFullscreenModeClose } from './components/back-button/fullscreen-mode-close';
export { __experimentalMainDashboardButton };
export { store } from './store';
export * from './deprecated';
