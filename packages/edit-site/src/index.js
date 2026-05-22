/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import {
	registerCoreBlocks,
	__experimentalGetCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { dispatch, resolveSelect, select } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { createRoot, StrictMode } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	registerLegacyWidgetBlock,
	registerWidgetGroupBlock,
} from '@wordpress/widgets';
import { store as coreDataStore } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from './store';
import { unlock } from './lock-unlock';
import App from './components/app';
import { pageItemRoute } from './components/site-editor-routes/page-item';

const { registerCoreBlockBindingsSources } = unlock( editorPrivateApis );
const { recognizePath } = unlock( routerPrivateApis );

const { enablePreloadMultiUse, clearPreloadedData } = unlock(
	apiFetch.privateApis
);

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
		showCollaborationCursor: false,
		showCollaborationNotifications: true,
	} );

	if ( window.__clientSideMediaProcessing ) {
		dispatch( preferencesStore ).setDefaults( 'core/media', {
			requireApproval: true,
			optimizeOnUpload: true,
		} );
	}

	dispatch( editSiteStore ).updateSettings( settings );

	// Prevent the default browser action for files dropped outside of dropzones.
	window.addEventListener( 'dragover', ( e ) => e.preventDefault(), false );
	window.addEventListener( 'drop', ( e ) => e.preventDefault(), false );

	// Drive the resolvers whose data `createPreloadingMiddleware`
	// already has cached so every metadata entry they touch is
	// `finished` by the time React mounts — no `setTimeout(0)`
	// resolution dance on first render. Multi-use lets a single
	// preloaded URL back several selectors (e.g. /wp/v2/settings GET +
	// OPTIONS serves `getEntitiesConfig`, `canUser`, `getEntityRecord`).
	enablePreloadMultiUse();
	const preloadedResolutions = preloadResolutions();

	preloadedResolutions.finally( () => {
		// Anything not consumed by the kickoff falls through to a real
		// network request from here on. `clearPreloadedData` logs which
		// preload entries (if any) were never served.
		clearPreloadedData();
		root.render(
			<StrictMode>
				<App />
			</StrictMode>
		);
	} );

	return root;
}

/**
 * Drive the post-agnostic resolvers to completion against the preload
 * cache before React mounts. The site editor's current entity is
 * derived from the URL after mount, so per-entity resolvers aren't
 * kicked off here.
 *
 * @return {Promise<void>} Resolves when the kickoff resolvers settle.
 */
async function preloadResolutions() {
	const core = resolveSelect( coreDataStore );
	const coreSelect = select( coreDataStore );

	// `gutenberg_block_editor_preload_paths_6_9` only ships the
	// front-page / home template lookups when the site editor is on the
	// root screen. Mirror that filter here so we don't fire them as real
	// network requests when they aren't preloaded.
	const params = new URLSearchParams( window.location.search );
	const routeParam = params.get( 'p' );
	const isRootScreen = routeParam === null || routeParam === '/';
	// When editing a specific page (`p=/page/N`), the server preloads
	// the page record and its template lookup. Pick those up in a
	// second phase once the postType entity config has resolved. The
	// match runs the same `:postId` parsing the post-mount router
	// uses, but pre-mount so the kickoff can drive the resolver.
	const pageMatch =
		routeParam !== null
			? recognizePath( [ pageItemRoute ], routeParam )
			: undefined;
	const pageId = pageMatch?.params?.postId
		? Number( pageMatch.params.postId )
		: null;

	try {
		await Promise.all( [
			core.getEntitiesConfig( 'postType' ),
			core.getEntitiesConfig( 'taxonomy' ),
			core.getEntitiesConfig( 'root' ),
			core.getCurrentTheme(),
			// Forward-resolver alias of `getCurrentTheme` with its own
			// resolution metadata, so it needs a separate kick.
			core.getThemeSupports(),
			core.getBlockPatternCategories(),
			core.__experimentalGetCurrentGlobalStylesId(),
			core.__experimentalGetCurrentThemeBaseGlobalStyles(),
			core.__experimentalGetCurrentThemeGlobalStylesVariations(),
			core.getEntityRecord( 'root', '__unstableBase' ),
			core.getEntityRecord( 'root', 'site' ),
			core.canUser( 'read', { kind: 'root', name: 'site' } ),
			core.canUser( 'create', { kind: 'postType', name: 'attachment' } ),
			core.canUser( 'create', { kind: 'postType', name: 'page' } ),
			core.canUser( 'create', {
				kind: 'postType',
				name: 'wp_navigation',
			} ),
			// Editor code calls `getPostType( name )` everywhere, not
			// `getEntityRecord( 'root', 'postType', name )`. The
			// shorthand has its own resolution metadata.
			core.getPostType( 'wp_template' ),
			core.getPostType( 'wp_template_part' ),
			core.getEntityRecords( 'postType', 'wp_template', {
				per_page: -1,
			} ),
			core.getEntityRecords( 'postType', 'wp_template_part', {
				per_page: -1,
			} ),
			core.getEntityRecords( 'postType', 'wp_navigation', {
				context: 'edit',
				order: 'desc',
				orderby: 'date',
				per_page: 100,
				status: [ 'publish', 'draft' ],
			} ),
			...( isRootScreen
				? [
						core.getDefaultTemplateId( { slug: 'front-page' } ),
						core.getDefaultTemplateId( { slug: 'home' } ),
				  ]
				: [] ),
		] );

		// Phase 2: theme-derived resolvers that need phase-1 state.
		const tasks = [];
		const globalStylesId =
			coreSelect.__experimentalGetCurrentGlobalStylesId();
		if ( globalStylesId ) {
			tasks.push(
				core.getEntityRecord( 'root', 'globalStyles', globalStylesId ),
				core.canUser( 'read', {
					kind: 'root',
					name: 'globalStyles',
					id: globalStylesId,
				} )
			);
		}
		if ( pageId ) {
			tasks.push( core.getEntityRecord( 'postType', 'page', pageId ) );
		}
		if ( tasks.length ) {
			await Promise.all( tasks );
		}

		// Phase 3: the page's per-slug template lookup needs the page
		// record from phase 2.
		if ( pageId ) {
			const page = coreSelect.getEntityRecord(
				'postType',
				'page',
				pageId
			);
			if ( page?.slug ) {
				await core.getDefaultTemplateId( {
					slug: `page-${ page.slug }`,
				} );
			}
		}
	} catch {
		// Resolver failures here would also surface on demand; don't block render.
	}
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
