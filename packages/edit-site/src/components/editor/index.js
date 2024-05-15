/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Notice,
	__unstableAnimatePresence as AnimatePresence,
	__unstableMotion as motion,
} from '@wordpress/components';
import {
	useInstanceId,
	useViewportMatch,
	useReducedMotion,
} from '@wordpress/compose';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	BlockBreadcrumb,
	BlockToolbar,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	EditorKeyboardShortcutsRegister,
	EditorKeyboardShortcuts,
	EditorNotices,
	EditorSnackbars,
	privateApis as editorPrivateApis,
	store as editorStore,
} from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreDataStore } from '@wordpress/core-data';
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';
import { useState, useCallback } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import CodeEditor from '../code-editor';
import Header from '../header-edit-mode';
import WelcomeGuide from '../welcome-guide';
import { store as editSiteStore } from '../../store';
import { GlobalStylesRenderer } from '../global-styles-renderer';
import useTitle from '../routes/use-title';
import CanvasLoader from '../canvas-loader';
import { unlock } from '../../lock-unlock';
import useEditedEntityRecord from '../use-edited-entity-record';
import PatternModal from '../pattern-modal';
import { POST_TYPE_LABELS, TEMPLATE_POST_TYPE } from '../../utils/constants';
import SiteEditorCanvas from '../block-editor/site-editor-canvas';
import TemplatePartConverter from '../template-part-converter';
import { useSpecificEditorSettings } from '../block-editor/use-site-editor-settings';
import PluginTemplateSettingPanel from '../plugin-template-setting-panel';
import GlobalStylesSidebar from '../global-styles-sidebar';

const {
	ExperimentalEditorProvider: EditorProvider,
	InserterSidebar,
	ListViewSidebar,
	InterfaceSkeleton,
	ComplementaryArea,
	interfaceStore,
	SavePublishPanels,
	Sidebar,
} = unlock( editorPrivateApis );
const { useHistory } = unlock( routerPrivateApis );
const { BlockKeyboardShortcuts } = unlock( blockLibraryPrivateApis );

const interfaceLabels = {
	/* translators: accessibility text for the editor content landmark region. */
	body: __( 'Editor content' ),
	/* translators: accessibility text for the editor settings landmark region. */
	sidebar: __( 'Editor settings' ),
	/* translators: accessibility text for the editor publish landmark region. */
	actions: __( 'Editor publish' ),
	/* translators: accessibility text for the editor footer landmark region. */
	footer: __( 'Editor footer' ),
	/* translators: accessibility text for the editor header landmark region. */
	header: __( 'Editor top bar' ),
};

const ANIMATION_DURATION = 0.25;

export default function Editor( { isLoading, onClick } ) {
	const {
		record: editedPost,
		getTitle,
		isLoaded: hasLoadedPost,
	} = useEditedEntityRecord();

	const { type: editedPostType } = editedPost;

	const isLargeViewport = useViewportMatch( 'medium' );
	const disableMotion = useReducedMotion();

	const {
		context,
		contextPost,
		editorMode,
		canvasMode,
		blockEditorMode,
		isRightSidebarOpen,
		isInserterOpen,
		isListViewOpen,
		isDistractionFree,
		showIconLabels,
		showBlockBreadcrumbs,
		postTypeLabel,
		isEditingPage,
		supportsGlobalStyles,
	} = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		const { getEditedPostContext, getCanvasMode, isPage } = unlock(
			select( editSiteStore )
		);
		const { __unstableGetEditorMode } = select( blockEditorStore );
		const { getActiveComplementaryArea } = select( interfaceStore );
		const { getEntityRecord, getCurrentTheme } = select( coreDataStore );
		const {
			isInserterOpened,
			isListViewOpened,
			getPostTypeLabel,
			getEditorMode,
		} = select( editorStore );
		const _context = getEditedPostContext();

		// The currently selected entity to display.
		// Typically template or template part in the site editor.
		return {
			context: _context,
			contextPost: _context?.postId
				? getEntityRecord(
						'postType',
						_context.postType,
						_context.postId
				  )
				: undefined,
			editorMode: getEditorMode(),
			canvasMode: getCanvasMode(),
			blockEditorMode: __unstableGetEditorMode(),
			isInserterOpen: isInserterOpened(),
			isListViewOpen: isListViewOpened(),
			isRightSidebarOpen: getActiveComplementaryArea( 'core' ),
			isDistractionFree: get( 'core', 'distractionFree' ),
			showBlockBreadcrumbs: get( 'core', 'showBlockBreadcrumbs' ),
			showIconLabels: get( 'core', 'showIconLabels' ),
			postTypeLabel: getPostTypeLabel(),
			isEditingPage: isPage(),
			supportsGlobalStyles: getCurrentTheme()?.is_block_theme,
		};
	}, [] );

	const isViewMode = canvasMode === 'view';
	const isEditMode = canvasMode === 'edit';
	const showVisualEditor = isViewMode || editorMode === 'visual';
	const shouldShowBlockBreadcrumbs =
		! isDistractionFree &&
		showBlockBreadcrumbs &&
		isEditMode &&
		showVisualEditor &&
		blockEditorMode !== 'zoom-out';
	const shouldShowInserter = isEditMode && showVisualEditor && isInserterOpen;
	const shouldShowListView = isEditMode && showVisualEditor && isListViewOpen;
	const secondarySidebarLabel = isListViewOpen
		? __( 'List View' )
		: __( 'Block Library' );
	const postWithTemplate = !! context?.postId;

	let title;
	if ( hasLoadedPost ) {
		title = sprintf(
			// translators: A breadcrumb trail for the Admin document title. %1$s: title of template being edited, %2$s: type of template (Template or Template Part).
			__( '%1$s ‹ %2$s' ),
			getTitle(),
			POST_TYPE_LABELS[ editedPostType ] ??
				POST_TYPE_LABELS[ TEMPLATE_POST_TYPE ]
		);
	}

	// Only announce the title once the editor is ready to prevent "Replace"
	// action in <URLQueryController> from double-announcing.
	useTitle( hasLoadedPost && title );

	const loadingProgressId = useInstanceId(
		CanvasLoader,
		'edit-site-editor__loading-progress'
	);

	const { closeGeneralSidebar } = useDispatch( editSiteStore );

	const settings = useSpecificEditorSettings();

	// Local state for save panel.
	// Note 'truthy' callback implies an open panel.
	const [ entitiesSavedStatesCallback, setEntitiesSavedStatesCallback ] =
		useState( false );

	const closeEntitiesSavedStates = useCallback(
		( arg ) => {
			if ( typeof entitiesSavedStatesCallback === 'function' ) {
				entitiesSavedStatesCallback( arg );
			}
			setEntitiesSavedStatesCallback( false );
		},
		[ entitiesSavedStatesCallback ]
	);

	const { createSuccessNotice } = useDispatch( noticesStore );
	const history = useHistory();
	const onActionPerformed = useCallback(
		( actionId, items ) => {
			switch ( actionId ) {
				case 'move-to-trash':
					{
						history.push( {
							path: '/' + items[ 0 ].type,
							postId: undefined,
							postType: undefined,
							canvas: 'view',
						} );
					}
					break;
				case 'duplicate-post':
					{
						const newItem = items[ 0 ];
						const _title =
							typeof newItem.title === 'string'
								? newItem.title
								: newItem.title?.rendered;
						createSuccessNotice(
							sprintf(
								// translators: %s: Title of the created post e.g: "Post 1".
								__( '"%s" successfully created.' ),
								_title
							),
							{
								type: 'snackbar',
								id: 'duplicate-post-action',
								actions: [
									{
										label: __( 'Edit' ),
										onClick: () => {
											history.push( {
												path: undefined,
												postId: newItem.id,
												postType: newItem.type,
												canvas: 'edit',
											} );
										},
									},
								],
							}
						);
					}
					break;
			}
		},
		[ history, createSuccessNotice ]
	);

	const isReady =
		! isLoading &&
		( ( postWithTemplate && !! contextPost && !! editedPost ) ||
			( ! postWithTemplate && !! editedPost ) );

	return (
		<>
			{ ! isReady ? <CanvasLoader id={ loadingProgressId } /> : null }
			{ isEditMode && <WelcomeGuide /> }
			{ hasLoadedPost && ! editedPost && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						"You attempted to edit an item that doesn't exist. Perhaps it was deleted?"
					) }
				</Notice>
			) }
			{ isReady && (
				<EditorProvider
					post={ postWithTemplate ? contextPost : editedPost }
					__unstableTemplate={
						postWithTemplate ? editedPost : undefined
					}
					settings={ settings }
					useSubRegistry={ false }
				>
					<InterfaceSkeleton
						isDistractionFree={ isDistractionFree }
						enableRegionNavigation={ false }
						className={ clsx(
							'edit-site-editor__interface-skeleton',
							{
								'show-icon-labels': showIconLabels,
								'is-entity-save-view-open':
									!! entitiesSavedStatesCallback,
							}
						) }
						header={
							<AnimatePresence initial={ false }>
								{ canvasMode === 'edit' && (
									<motion.div
										initial={ {
											marginTop: -60,
										} }
										animate={ {
											marginTop: 0,
										} }
										exit={ {
											marginTop: -60,
										} }
										transition={ {
											type: 'tween',
											duration:
												// Disable transition in mobile to emulate a full page transition.
												disableMotion ||
												! isLargeViewport
													? 0
													: ANIMATION_DURATION,
											ease: [ 0.6, 0, 0.4, 1 ],
										} }
									>
										<Header
											setEntitiesSavedStatesCallback={
												setEntitiesSavedStatesCallback
											}
										/>
									</motion.div>
								) }
							</AnimatePresence>
						}
						actions={
							<SavePublishPanels
								closeEntitiesSavedStates={
									closeEntitiesSavedStates
								}
								isEntitiesSavedStatesOpen={
									entitiesSavedStatesCallback
								}
								setEntitiesSavedStatesCallback={
									setEntitiesSavedStatesCallback
								}
							/>
						}
						notices={ <EditorSnackbars /> }
						content={
							<>
								<GlobalStylesRenderer />
								{ isEditMode && <EditorNotices /> }
								{ showVisualEditor && (
									<>
										<TemplatePartConverter />
										{ ! isLargeViewport && (
											<BlockToolbar hideDragHandle />
										) }
										<SiteEditorCanvas onClick={ onClick } />
										<PatternModal />
									</>
								) }
								{ editorMode === 'text' && isEditMode && (
									<CodeEditor />
								) }
								{ isEditMode && (
									<>
										<EditorKeyboardShortcutsRegister />
										<EditorKeyboardShortcuts />
										<BlockKeyboardShortcuts />
									</>
								) }
							</>
						}
						secondarySidebar={
							isEditMode &&
							( ( shouldShowInserter && (
								<InserterSidebar
									closeGeneralSidebar={ closeGeneralSidebar }
									isRightSidebarOpen={ isRightSidebarOpen }
								/>
							) ) ||
								( shouldShowListView && <ListViewSidebar /> ) )
						}
						sidebar={
							isEditMode &&
							! isDistractionFree && (
								<ComplementaryArea.Slot scope="core" />
							)
						}
						footer={
							shouldShowBlockBreadcrumbs && (
								<BlockBreadcrumb
									rootLabelText={ postTypeLabel }
								/>
							)
						}
						labels={ {
							...interfaceLabels,
							secondarySidebar: secondarySidebarLabel,
						} }
					/>
					<Sidebar
						onActionPerformed={ onActionPerformed }
						extraPanels={
							! isEditingPage && (
								<PluginTemplateSettingPanel.Slot />
							)
						}
					/>
					{ supportsGlobalStyles && <GlobalStylesSidebar /> }
				</EditorProvider>
			) }
		</>
	);
}
