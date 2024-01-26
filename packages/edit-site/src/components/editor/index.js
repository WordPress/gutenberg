/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Notice } from '@wordpress/components';
import { useInstanceId, useViewportMatch } from '@wordpress/compose';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	BlockBreadcrumb,
	BlockToolbar,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
	BlockInspector,
} from '@wordpress/block-editor';
import {
	InterfaceSkeleton,
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';
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

/**
 * Internal dependencies
 */
import {
	SidebarComplementaryAreaFills,
	SidebarInspectorFill,
} from '../sidebar-edit-mode';
import CodeEditor from '../code-editor';
import KeyboardShortcutsEditMode from '../keyboard-shortcuts/edit-mode';
import WelcomeGuide from '../welcome-guide';
import StartTemplateOptions from '../start-template-options';
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

const { BlockRemovalWarningModal } = unlock( blockEditorPrivateApis );
const {
	ExperimentalEditorProvider: EditorProvider,
	InserterSidebar,
	ListViewSidebar,
} = unlock( editorPrivateApis );

const interfaceLabels = {
	/* translators: accessibility text for the editor content landmark region. */
	body: __( 'Editor content' ),
	/* translators: accessibility text for the editor settings landmark region. */
	sidebar: __( 'Editor settings' ),
	/* translators: accessibility text for the editor publish landmark region. */
	actions: __( 'Editor publish' ),
	/* translators: accessibility text for the editor footer landmark region. */
	footer: __( 'Editor footer' ),
};

// Prevent accidental removal of certain blocks, asking the user for
// confirmation.
const blockRemovalRules = {
	'core/query': __( 'Query Loop displays a list of posts or pages.' ),
	'core/post-content': __(
		'Post Content displays the content of a post or page.'
	),
	'core/post-template': __(
		'Post Template displays each post or page in a Query Loop.'
	),
};

export default function Editor( { isLoading } ) {
	const {
		record: editedPost,
		getTitle,
		isLoaded: hasLoadedPost,
	} = useEditedEntityRecord();

	const { type: editedPostType } = editedPost;

	const isLargeViewport = useViewportMatch( 'medium' );

	const {
		context,
		contextPost,
		editorMode,
		canvasMode,
		blockEditorMode,
		isRightSidebarOpen,
		isInserterOpen,
		isListViewOpen,
		showIconLabels,
		showBlockBreadcrumbs,
		postTypeLabel,
	} = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		const { getEditedPostContext, getEditorMode, getCanvasMode } = unlock(
			select( editSiteStore )
		);
		const { __unstableGetEditorMode } = select( blockEditorStore );
		const { getActiveComplementaryArea } = select( interfaceStore );
		const { getEntityRecord } = select( coreDataStore );
		const { isInserterOpened, isListViewOpened, getPostTypeLabel } =
			select( editorStore );
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
			isRightSidebarOpen: getActiveComplementaryArea(
				editSiteStore.name
			),
			showBlockBreadcrumbs: get( 'core', 'showBlockBreadcrumbs' ),
			showIconLabels: get( 'core', 'showIconLabels' ),
			postTypeLabel: getPostTypeLabel(),
		};
	}, [] );

	const isViewMode = canvasMode === 'view';
	const isEditMode = canvasMode === 'edit';
	const showVisualEditor = isViewMode || editorMode === 'visual';
	const shouldShowBlockBreadcrumbs =
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

	const settings = useSpecificEditorSettings();
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
					<SidebarComplementaryAreaFills />
					{ isEditMode && <StartTemplateOptions /> }
					<InterfaceSkeleton
						isDistractionFree={ true }
						enableRegionNavigation={ false }
						className={ classnames(
							'edit-site-editor__interface-skeleton',
							{
								'show-icon-labels': showIconLabels,
							}
						) }
						notices={ <EditorSnackbars /> }
						content={
							<>
								<GlobalStylesRenderer />
								{ isEditMode && <EditorNotices /> }
								{ showVisualEditor && (
									<>
										<TemplatePartConverter />
										<SidebarInspectorFill>
											<BlockInspector />
										</SidebarInspectorFill>
										{ ! isLargeViewport && (
											<BlockToolbar hideDragHandle />
										) }
										<SiteEditorCanvas />
										<BlockRemovalWarningModal
											rules={ blockRemovalRules }
										/>
										<PatternModal />
									</>
								) }
								{ editorMode === 'text' && isEditMode && (
									<CodeEditor />
								) }
								{ isEditMode && (
									<>
										<KeyboardShortcutsEditMode />
										<EditorKeyboardShortcutsRegister />
										<EditorKeyboardShortcuts />
									</>
								) }
							</>
						}
						secondarySidebar={
							isEditMode &&
							( ( shouldShowInserter && <InserterSidebar /> ) ||
								( shouldShowListView && <ListViewSidebar /> ) )
						}
						sidebar={
							isEditMode &&
							isRightSidebarOpen && (
								<>
									<ComplementaryArea.Slot scope="core/edit-site" />
								</>
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
				</EditorProvider>
			) }
		</>
	);
}
