/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SidebarComplementaryAreaFills } from '../sidebar-edit-mode';
import BlockEditor from '../block-editor';
import CodeEditor from '../code-editor';
import KeyboardShortcutsEditMode from '../keyboard-shortcuts/edit-mode';
import InserterSidebar from '../secondary-sidebar/inserter-sidebar';
import ListViewSidebar from '../secondary-sidebar/list-view-sidebar';
import WelcomeGuide from '../welcome-guide';
import StartTemplateOptions from '../start-template-options';
import { store as editSiteStore } from '../../store';
import { GlobalStylesRenderer } from '../global-styles-renderer';

import useTitle from '../routes/use-title';
import CanvasSpinner from '../canvas-spinner';
import { unlock } from '../../private-apis';
import useEditedEntityRecord from '../use-edited-entity-record';
import { SidebarFixedBottomSlot } from '../sidebar-edit-mode/sidebar-fixed-bottom';

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

function useIsSiteEditorLoading() {
	const { isLoaded: hasLoadedPost } = useEditedEntityRecord();
	const { hasResolvingSelectors } = useSelect( ( select ) => {
		return {
			hasResolvingSelectors: select( coreStore ).hasResolvingSelectors(),
		};
	} );
	const [ loaded, setLoaded ] = useState( false );
	const inLoadingPause = ! loaded && ! hasResolvingSelectors;

	useEffect( () => {
		if ( inLoadingPause ) {
			/*
			 * We're using an arbitrary 1s timeout here to catch brief moments
			 * without any resolving selectors that would result in displaying
			 * brief flickers of loading state and loaded state.
			 *
			 * It's worth experimenting with different values, since this also
			 * adds 1s of artificial delay after loading has finished.
			 */
			const timeout = setTimeout( () => {
				setLoaded( true );
			}, 1000 );

			return () => {
				clearTimeout( timeout );
			};
		}
	}, [ inLoadingPause ] );

	return ! loaded || ! hasLoadedPost;
}

export default function Editor() {
	const {
		record: editedPost,
		getTitle,
		isLoaded: hasLoadedPost,
	} = useEditedEntityRecord();

	const { id: editedPostId, type: editedPostType } = editedPost;

	const {
		context,
		editorMode,
		canvasMode,
		blockEditorMode,
		isRightSidebarOpen,
		isInserterOpen,
		isListViewOpen,
		showIconLabels,
		showBlockBreadcrumbs,
	} = useSelect( ( select ) => {
		const {
			getEditedPostContext,
			getEditorMode,
			getCanvasMode,
			isInserterOpened,
			isListViewOpened,
		} = unlock( select( editSiteStore ) );
		const { __unstableGetEditorMode } = select( blockEditorStore );
		const { getActiveComplementaryArea } = select( interfaceStore );

		// The currently selected entity to display.
		// Typically template or template part in the site editor.
		return {
			context: getEditedPostContext(),
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
			showBlockBreadcrumbs: select( preferencesStore ).get(
				'core/edit-site',
				'showBlockBreadcrumbs'
			),
		};
	}, [] );
	const { setEditedPostContext } = useDispatch( editSiteStore );

	const isViewMode = canvasMode === 'view';
	const isEditMode = canvasMode === 'edit';
	const showVisualEditor = isViewMode || editorMode === 'visual';
	const shouldShowBlockBreakcrumbs =
		showBlockBreadcrumbs &&
		isEditMode &&
		showVisualEditor &&
		blockEditorMode !== 'zoom-out';
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
		[ context, setEditedPostContext ]
	);

	let title;
	if ( hasLoadedPost ) {
		const type =
			editedPostType === 'wp_template'
				? __( 'Template' )
				: __( 'Template Part' );
		title = sprintf(
			// translators: A breadcrumb trail in browser tab. %1$s: title of template being edited, %2$s: type of template (Template or Template Part).
			__( '%1$s ‹ %2$s ‹ Editor' ),
			getTitle(),
			type
		);
	}

	// Only announce the title once the editor is ready to prevent "Replace"
	// action in <URlQueryController> from double-announcing.
	useTitle( hasLoadedPost && title );

	const isLoading = useIsSiteEditorLoading();

	return (
		<>
			{ isLoading ? <CanvasSpinner /> : null }
			{ isEditMode && <WelcomeGuide /> }
			<EntityProvider kind="root" type="site">
				<EntityProvider
					kind="postType"
					type={ editedPostType }
					id={ editedPostId }
				>
					<BlockContextProvider value={ blockContext }>
						<SidebarComplementaryAreaFills />
						{ isEditMode && <StartTemplateOptions /> }
						<InterfaceSkeleton
							enableRegionNavigation={ false }
							className={ showIconLabels && 'show-icon-labels' }
							notices={
								( isEditMode ||
									window?.__experimentalEnableThemePreviews ) && (
									<EditorSnackbars />
								)
							}
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
									{ isEditMode && (
										<KeyboardShortcutsEditMode />
									) }
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
									<>
										<ComplementaryArea.Slot scope="core/edit-site" />
										<SidebarFixedBottomSlot />
									</>
								)
							}
							footer={
								shouldShowBlockBreakcrumbs && (
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
				</EntityProvider>
			</EntityProvider>
		</>
	);
}
