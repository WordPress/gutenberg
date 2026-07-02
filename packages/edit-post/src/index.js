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
import { applyFilters } from '@wordpress/hooks';
import {
	registerLegacyWidgetBlock,
	registerWidgetGroupBlock,
} from '@wordpress/widgets';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { store as coreDataStore } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import Layout from './components/layout';
import { unlock } from './lock-unlock';

const {
	BackButton: __experimentalMainDashboardButton,
	registerCoreBlockBindingsSources,
} = unlock( editorPrivateApis );

const { enablePreloadMultiUse, clearPreloadedData } = unlock(
	apiFetch.privateApis
);

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

	const collaborationNotificationPreferenceDefaults = applyFilters(
		'editor.CollaborationNotificationPreferenceDefaults',
		{
			showCollaborationJoinNotifications: true,
			showCollaborationLeaveNotifications: true,
			showCollaborationPostSaveNotifications: true,
		},
		'core/edit-post'
	);

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
		showCollaborationJoinNotifications:
			collaborationNotificationPreferenceDefaults.showCollaborationJoinNotifications,
		showCollaborationLeaveNotifications:
			collaborationNotificationPreferenceDefaults.showCollaborationLeaveNotifications,
		showCollaborationPostSaveNotifications:
			collaborationNotificationPreferenceDefaults.showCollaborationPostSaveNotifications,
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

	// Drive the resolvers whose data `createPreloadingMiddleware`
	// already has cached so every metadata entry they touch is
	// `finished` by the time React mounts — no `setTimeout(0)`
	// resolution dance on first render. Multi-use lets a single
	// preloaded URL back several selectors (e.g. /wp/v2/settings GET +
	// OPTIONS serves `getEntitiesConfig`, `canUser`, `getEntityRecord`).
	enablePreloadMultiUse();
	const preloadedResolutions = preloadResolutions( postType, postId );

	preloadedResolutions.finally( () => {
		// Anything not consumed by the kickoff falls through to a real
		// network request from here on. `clearPreloadedData` logs which
		// preload entries (if any) were never served.
		clearPreloadedData();
		if ( postType && postId ) {
			const post = select( coreDataStore ).getEntityRecord(
				'postType',
				postType,
				postId
			);
			if ( post ) {
				dispatch( editorStore ).setupEditor(
					post,
					initialEdits,
					settings.template
				);
			}
		}
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
 * Drive resolvers to completion against the preload cache before React
 * mounts. Two phases: known-up-front args (post id + type), then args
 * derived from phase-1 state (post slug → template, current global
 * styles id → record + canUser).
 *
 * @param {string} postType Current post type.
 * @param {number} postId   Current post id.
 * @return {Promise<void>}  Resolves when the kickoff resolvers settle.
 */
async function preloadResolutions( postType, postId ) {
	const core = resolveSelect( coreDataStore );
	const coreSelect = select( coreDataStore );

	try {
		await Promise.all( [
			core.getCurrentUser(),
			core.getEntitiesConfig( 'postType' ),
			core.getEntitiesConfig( 'taxonomy' ),
			core.getEntitiesConfig( 'root' ),
			core.getEntityRecords( 'root', 'taxonomy' ),
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
			core.canUser( 'create', { kind: 'postType', name: 'wp_block' } ),
			core.canUser( 'create', {
				kind: 'postType',
				name: 'wp_template',
			} ),
			// Per-post resolvers. `getPostType` and `getEditedEntityRecord`
			// are shorthand/forward-resolver aliases with their own
			// resolution metadata, so they need separate kicks.
			...( postType && postId
				? [
						core.getPostType( postType ),
						core.getEntityRecord( 'postType', postType, postId ),
						core.getEditedEntityRecord(
							'postType',
							postType,
							postId
						),
						core.getAutosaves( postType, postId ),
						core.getDefaultTemplateId( { slug: 'front-page' } ),
						core.canUser( 'create', {
							kind: 'postType',
							name: postType,
						} ),
				  ]
				: [] ),
		] );

		// Phase 2: read derived data out of state.
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

		if ( postType && postId ) {
			const post = coreSelect.getEntityRecord(
				'postType',
				postType,
				postId
			);
			if ( post ) {
				// Mirrors core-data's `getDefaultTemplate` slug formula.
				let slug = 'page' === postType ? 'page' : 'single-' + postType;
				if ( post.slug ) {
					slug += '-' + post.slug;
				}
				tasks.push( core.getDefaultTemplateId( { slug } ) );

				if ( post.author ) {
					tasks.push(
						core.getUser( post.author, {
							context: 'view',
							_fields: 'id,name',
						} )
					);
				}
			}
		}

		if ( tasks.length ) {
			await Promise.all( tasks );
		}
	} catch {
		// Resolver failures here would also surface on demand; don't block render.
	}
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
