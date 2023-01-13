/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Notice } from '@wordpress/components';
import { EntityProvider, store as coreStore } from '@wordpress/core-data';
import { store as preferencesStore } from '@wordpress/preferences';
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
import { EditorNotices, EditorSnackbars } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SidebarComplementaryAreaFills } from '../sidebar-edit-mode';
import BlockEditor from '../block-editor';
import CodeEditor from '../code-editor';
import KeyboardShortcuts from '../keyboard-shortcuts';
import InserterSidebar from '../secondary-sidebar/inserter-sidebar';
import ListViewSidebar from '../secondary-sidebar/list-view-sidebar';
import WelcomeGuide from '../welcome-guide';
import { store as editSiteStore } from '../../store';
import { GlobalStylesRenderer } from '../global-styles-renderer';
import { GlobalStylesProvider } from '../global-styles/global-styles-provider';
import useTitle from '../routes/use-title';
import CanvasSpinner from '../canvas-spinner';
import { unlock } from '../../experiments';

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

export default function Editor() {
	const {
		editedPostId,
		editedPostType,
		editedPost,
		context,
		hasLoadedPost,
		editorMode,
		canvasMode,
		blockEditorMode,
		isRightSidebarOpen,
		isInserterOpen,
		isListViewOpen,
		showIconLabels,
	} = useSelect( ( select ) => {
		const {
			getEditedPostType,
			getEditedPostId,
			getEditedPostContext,
			getEditorMode,
			getCanvasMode,
			isInserterOpened,
			isListViewOpened,
		} = unlock( select( editSiteStore ) );
		const { hasFinishedResolution, getEntityRecord } = select( coreStore );
		const { __unstableGetEditorMode } = select( blockEditorStore );
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
			context: getEditedPostContext(),
			hasLoadedPost: postId
				? hasFinishedResolution( 'getEntityRecord', [
						'postType',
						postType,
						postId,
				  ] )
				: false,
			editorMode: getEditorMode(),
			canvasMode: getCanvasMode(),
			blockEditorMode: __unstableGetEditorMode(),
			isInserterOpen: isInserterOpened(),
			isListViewOpen: isListViewOpened(),
			isRightSidebarOpen: getActiveComplementaryArea(
				editSiteStore.name
			),
			showIconLabels: select( preferencesStore ).get(
				'core/edit-site',
				'showIconLabels'
			),
		};
	}, [] );
	const { setEditedPostContext } = useDispatch( editSiteStore );

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
			...context,
			queryContext: [
				context?.queryContext || { page: 1 },
				( newQueryContext ) =>
					setEditedPostContext( {
						...context,
						queryContext: {
							...context?.queryContext,
							...newQueryContext,
						},
					} ),
			],
		} ),
		[ context ]
	);
	const isReady = editedPostType !== undefined && editedPostId !== undefined;

	// Only announce the title once the editor is ready to prevent "Replace"
	// action in <URlQueryController> from double-announcing.
	useTitle( isReady && __( 'Editor (beta)' ) );

	if ( ! isReady ) {
		return <CanvasSpinner />;
	}

	return (
		<>
			{ isEditMode && <WelcomeGuide /> }
			<KeyboardShortcuts.Register />
			<EntityProvider kind="root" type="site">
				<EntityProvider
					kind="postType"
					type={ editedPostType }
					id={ editedPostId }
				>
					<GlobalStylesProvider>
						<BlockContextProvider value={ blockContext }>
							<SidebarComplementaryAreaFills />
							<InterfaceSkeleton
								enableRegionNavigation={ false }
								className={
									showIconLabels && 'show-icon-labels'
								}
								notices={ isEditMode && <EditorSnackbars /> }
								content={
									<>
										<GlobalStylesRenderer />
										{ isEditMode && <EditorNotices /> }
										{ showVisualEditor && editedPost && (
											<BlockEditor />
										) }
										{ editorMode === 'text' &&
											editedPost &&
											isEditMode && <CodeEditor /> }
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
										{ isEditMode && <KeyboardShortcuts /> }
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
								footer={
									showBlockBreakcrumb && (
										<BlockBreadcrumb
											rootLabelText={ __( 'Template' ) }
										/>
									)
								}
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
