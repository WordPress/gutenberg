/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Button, Notice } from '@wordpress/components';
import { EntityProvider, store as coreStore } from '@wordpress/core-data';
import {
	BlockContextProvider,
	BlockBreadcrumb,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	InterfaceSkeleton,
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';
import {
	EditorNotices,
	EditorSnackbars,
	EntitiesSavedStates,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import Header from '../header-edit-mode';
import { SidebarComplementaryAreaFills } from '../sidebar-edit-mode';
import BlockEditor from '../block-editor';
import CodeEditor from '../code-editor';
import KeyboardShortcuts from '../keyboard-shortcuts';
import useInitEditedEntityFromURL from '../use-init-edited-entity-from-url';
import InserterSidebar from '../secondary-sidebar/inserter-sidebar';
import ListViewSidebar from '../secondary-sidebar/list-view-sidebar';
import WelcomeGuide from '../welcome-guide';
import { store as editSiteStore } from '../../store';
import { GlobalStylesRenderer } from '../global-styles-renderer';
import { GlobalStylesProvider } from '../global-styles/global-styles-provider';
import useTitle from '../routes/use-title';
import HeaderViewMode from '../header-view-mode';

const interfaceLabels = {
	/* translators: accessibility text for the editor top bar landmark region. */
	header: __( 'Editor top bar' ),
	/* translators: accessibility text for the editor content landmark region. */
	body: __( 'Editor content' ),
	/* translators: accessibility text for the editor settings landmark region. */
	sidebar: __( 'Editor settings' ),
	/* translators: accessibility text for the editor publish landmark region. */
	actions: __( 'Editor publish' ),
	/* translators: accessibility text for the editor footer landmark region. */
	footer: __( 'Editor footer' ),
};

export default function Editor() {
	// This ensures the edited entity id and type are initialized properly.
	useInitEditedEntityFromURL();

	const {
		editedPostId,
		editedPostType,
		editedPost,
		page,
		hasLoadedPost,
		editorMode,
		canvasMode,
		blockEditorMode,
		isRightSidebarOpen,
		isInserterOpen,
		isListViewOpen,
		isSaveViewOpen,
		previousShortcut,
		nextShortcut,
	} = useSelect( ( select ) => {
		const {
			getEditedPostType,
			getEditedPostId,
			getPage,
			getEditorMode,
			__unstableGetCanvasMode,
			isInserterOpened,
			isListViewOpened,
			isSaveViewOpened,
		} = select( editSiteStore );
		const { hasFinishedResolution, getEntityRecord } = select( coreStore );
		const { __unstableGetEditorMode } = select( blockEditorStore );
		const { getAllShortcutKeyCombinations } = select(
			keyboardShortcutsStore
		);
		const { getActiveComplementaryArea } = select( interfaceStore );
		const postType = getEditedPostType();
		const postId = getEditedPostId();

		// The currently selected entity to display.
		// Typically template or template part in the site editor.
		return {
			editedPostId: postId,
			editedPostType: postType,
			editedPost: postId
				? getEntityRecord( 'postType', postType, postId )
				: null,
			page: getPage(),
			hasLoadedPost: postId
				? hasFinishedResolution( 'getEntityRecord', [
						'postType',
						postType,
						postId,
				  ] )
				: false,
			editorMode: getEditorMode(),
			canvasMode: __unstableGetCanvasMode(),
			blockEditorMode: __unstableGetEditorMode(),
			isInserterOpen: isInserterOpened(),
			isListViewOpen: isListViewOpened(),
			isSaveViewOpen: isSaveViewOpened(),
			isRightSidebarOpen: getActiveComplementaryArea(
				editSiteStore.name
			),
			previousShortcut: getAllShortcutKeyCombinations(
				'core/edit-site/previous-region'
			),
			nextShortcut: getAllShortcutKeyCombinations(
				'core/edit-site/next-region'
			),
		};
	}, [] );
	const { setIsSaveViewOpened, setPage } = useDispatch( editSiteStore );

	const isViewMode = canvasMode === 'view';
	const isEditMode = canvasMode === 'edit';
	const showVisualEditor = isViewMode || editorMode === 'visual';
	const showBlockBreakcrumb =
		isEditMode && showVisualEditor && blockEditorMode !== 'zoom-out';
	const shouldShowInserter = isEditMode && showVisualEditor && isInserterOpen;
	const shouldShowListView = isEditMode && showVisualEditor && isListViewOpen;
	const secondarySidebarLabel = isListViewOpen
		? __( 'List View' )
		: __( 'Block Library' );
	const blockContext = useMemo(
		() => ( {
			...page?.context,
			queryContext: [
				page?.context.queryContext || { page: 1 },
				( newQueryContext ) =>
					setPage( {
						...page,
						context: {
							...page?.context,
							queryContext: {
								...page?.context.queryContext,
								...newQueryContext,
							},
						},
					} ),
			],
		} ),
		[ page?.context ]
	);
	const isReady = editedPostType !== undefined && editedPostId !== undefined;

	// Only announce the title once the editor is ready to prevent "Replace"
	// action in <URlQueryController> from double-announcing.
	useTitle( isReady && __( 'Editor (beta)' ) );

	if ( ! isReady ) {
		return null;
	}

	return (
		<>
			{ isViewMode && <HeaderViewMode /> }
			{ isEditMode && <WelcomeGuide /> }
			<KeyboardShortcuts.Register />
			<SidebarComplementaryAreaFills />
			<EntityProvider kind="root" type="site">
				<EntityProvider
					kind="postType"
					type={ editedPostType }
					id={ editedPostId }
				>
					<GlobalStylesProvider>
						<BlockContextProvider value={ blockContext }>
							<InterfaceSkeleton
								header={ isEditMode && <Header /> }
								notices={ isEditMode && <EditorSnackbars /> }
								content={
									<>
										<GlobalStylesRenderer />

										<div
											inert={
												isViewMode ? 'true' : undefined
											}
											style={ { height: '100%' } }
										>
											<EditorNotices />
											{ showVisualEditor &&
												editedPost && <BlockEditor /> }
											{ editorMode === 'text' &&
												editedPost && <CodeEditor /> }
											{ hasLoadedPost && ! editedPost && (
												<Notice
													status="warning"
													isDismissible={ false }
												>
													{ __(
														"You attempted to edit an item that doesn't exist. Perhaps it was deleted?"
													) }
												</Notice>
											) }
											{ isEditMode && (
												<KeyboardShortcuts />
											) }
										</div>
									</>
								}
								secondarySidebar={
									isEditMode &&
									( ( shouldShowInserter && (
										<InserterSidebar />
									) ) ||
										( shouldShowListView && (
											<ListViewSidebar />
										) ) )
								}
								sidebar={
									isEditMode &&
									isRightSidebarOpen && (
										<ComplementaryArea.Slot scope="core/edit-site" />
									)
								}
								actions={
									<>
										{ isSaveViewOpen ? (
											<EntitiesSavedStates
												close={ () =>
													setIsSaveViewOpened( false )
												}
											/>
										) : (
											<div className="edit-site-editor__toggle-save-panel">
												<Button
													variant="secondary"
													className="edit-site-editor__toggle-save-panel-button"
													onClick={ () =>
														setIsSaveViewOpened(
															true
														)
													}
													aria-expanded={ false }
												>
													{ __( 'Open save panel' ) }
												</Button>
											</div>
										) }
									</>
								}
								footer={
									showBlockBreakcrumb && (
										<BlockBreadcrumb
											rootLabelText={ __( 'Template' ) }
										/>
									)
								}
								shortcuts={ {
									previous: previousShortcut,
									next: nextShortcut,
								} }
								labels={ {
									...interfaceLabels,
									secondarySidebar: secondarySidebarLabel,
								} }
							/>
						</BlockContextProvider>
					</GlobalStylesProvider>
				</EntityProvider>
			</EntityProvider>
		</>
	);
}
