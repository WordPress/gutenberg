/**
 * WordPress dependencies
 */
import { useEffect, useState, useMemo, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Popover, Button, Notice } from '@wordpress/components';
import { EntityProvider, store as coreStore } from '@wordpress/core-data';
import { BlockContextProvider, BlockBreadcrumb } from '@wordpress/block-editor';
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
import { PluginArea } from '@wordpress/plugins';
import {
	ShortcutProvider,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import Header from '../header';
import { SidebarComplementaryAreaFills } from '../sidebar';
import NavigationSidebar from '../navigation-sidebar';
import BlockEditor from '../block-editor';
import CodeEditor from '../code-editor';
import KeyboardShortcuts from '../keyboard-shortcuts';
import URLQueryController from '../url-query-controller';
import InserterSidebar from '../secondary-sidebar/inserter-sidebar';
import ListViewSidebar from '../secondary-sidebar/list-view-sidebar';
import ErrorBoundary from '../error-boundary';
import WelcomeGuide from '../welcome-guide';
import { store as editSiteStore } from '../../store';
import { GlobalStylesRenderer } from './global-styles-renderer';
import { GlobalStylesProvider } from '../global-styles/global-styles-provider';
import useTitle from '../routes/use-title';

const interfaceLabels = {
	secondarySidebar: __( 'Block Library' ),
	drawer: __( 'Navigation Sidebar' ),
};

function Editor( { onError } ) {
	const {
		isInserterOpen,
		isListViewOpen,
		settings,
		entityId,
		templateType,
		page,
		template,
		templateResolved,
		isNavigationOpen,
		previousShortcut,
		nextShortcut,
		editorMode,
	} = useSelect( ( select ) => {
		const {
			isInserterOpened,
			isListViewOpened,
			getSettings,
			getEditedPostType,
			getEditedPostId,
			getPage,
			isNavigationOpened,
			getEditorMode,
		} = select( editSiteStore );
		const { hasFinishedResolution, getEntityRecord } = select( coreStore );
		const postType = getEditedPostType();
		const postId = getEditedPostId();

		// The currently selected entity to display. Typically template or template part.
		return {
			isInserterOpen: isInserterOpened(),
			isListViewOpen: isListViewOpened(),
			sidebarIsOpened: !! select(
				interfaceStore
			).getActiveComplementaryArea( editSiteStore.name ),
			settings: getSettings(),
			templateType: postType,
			page: getPage(),
			template: postId
				? getEntityRecord( 'postType', postType, postId )
				: null,
			templateResolved: postId
				? hasFinishedResolution( 'getEntityRecord', [
						'postType',
						postType,
						postId,
				  ] )
				: false,
			entityId: postId,
			isNavigationOpen: isNavigationOpened(),
			previousShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations( 'core/edit-site/previous-region' ),
			nextShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations( 'core/edit-site/next-region' ),
			editorMode: getEditorMode(),
		};
	}, [] );
	const { setPage, setIsInserterOpened } = useDispatch( editSiteStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	const [
		isEntitiesSavedStatesOpen,
		setIsEntitiesSavedStatesOpen,
	] = useState( false );
	const openEntitiesSavedStates = useCallback(
		() => setIsEntitiesSavedStatesOpen( true ),
		[]
	);
	const closeEntitiesSavedStates = useCallback( () => {
		setIsEntitiesSavedStatesOpen( false );
	}, [] );

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

	useEffect( () => {
		if ( isNavigationOpen ) {
			document.body.classList.add( 'is-navigation-sidebar-open' );
		} else {
			document.body.classList.remove( 'is-navigation-sidebar-open' );
		}
	}, [ isNavigationOpen ] );

	useEffect(
		function openGlobalStylesOnLoad() {
			const searchParams = new URLSearchParams( window.location.search );
			if ( searchParams.get( 'styles' ) === 'open' ) {
				enableComplementaryArea(
					'core/edit-site',
					'edit-site/global-styles'
				);
			}
		},
		[ enableComplementaryArea ]
	);

	// Don't render the Editor until the settings are set and loaded
	const isReady =
		settings?.siteUrl &&
		templateType !== undefined &&
		entityId !== undefined;

	const secondarySidebar = () => {
		if ( isInserterOpen ) {
			return <InserterSidebar />;
		}
		if ( isListViewOpen ) {
			return <ListViewSidebar />;
		}
		return null;
	};

	// Only announce the title once the editor is ready to prevent "Replace"
	// action in <URlQueryController> from double-announcing.
	useTitle( isReady && __( 'Editor (beta)' ) );

	return (
		<>
			<URLQueryController />
			{ isReady && (
				<ShortcutProvider>
					<EntityProvider kind="root" type="site">
						<EntityProvider
							kind="postType"
							type={ templateType }
							id={ entityId }
						>
							<GlobalStylesProvider>
								<BlockContextProvider value={ blockContext }>
									<GlobalStylesRenderer />
									<ErrorBoundary onError={ onError }>
										<KeyboardShortcuts.Register />
										<SidebarComplementaryAreaFills />
										<InterfaceSkeleton
											labels={ interfaceLabels }
											secondarySidebar={ secondarySidebar() }
											drawer={
												<>
													<NavigationSidebar.Slot />
													<ComplementaryArea.Slot scope="core/edit-site" />
												</>
											}
											header={
												<Header
													openEntitiesSavedStates={
														openEntitiesSavedStates
													}
												/>
											}
											notices={ <EditorSnackbars /> }
											content={
												<>
													<EditorNotices />
													{ editorMode === 'visual' &&
														template && (
															<BlockEditor
																setIsInserterOpen={
																	setIsInserterOpened
																}
															/>
														) }
													{ editorMode === 'text' &&
														template && (
															<CodeEditor />
														) }
													{ templateResolved &&
														! template &&
														settings?.siteUrl &&
														entityId && (
															<Notice
																status="warning"
																isDismissible={
																	false
																}
															>
																{ __(
																	"You attempted to edit an item that doesn't exist. Perhaps it was deleted?"
																) }
															</Notice>
														) }
													<KeyboardShortcuts
														openEntitiesSavedStates={
															openEntitiesSavedStates
														}
													/>
												</>
											}
											actions={
												<>
													{ isEntitiesSavedStatesOpen ? (
														<EntitiesSavedStates
															close={
																closeEntitiesSavedStates
															}
														/>
													) : (
														<div className="edit-site-editor__toggle-save-panel">
															<Button
																variant="secondary"
																className="edit-site-editor__toggle-save-panel-button"
																onClick={
																	openEntitiesSavedStates
																}
																aria-expanded={
																	false
																}
															>
																{ __(
																	'Open save panel'
																) }
															</Button>
														</div>
													) }
												</>
											}
											footer={ <BlockBreadcrumb /> }
											shortcuts={ {
												previous: previousShortcut,
												next: nextShortcut,
											} }
										/>
										<WelcomeGuide />
										<Popover.Slot />
										<PluginArea />
									</ErrorBoundary>
								</BlockContextProvider>
							</GlobalStylesProvider>
						</EntityProvider>
					</EntityProvider>
				</ShortcutProvider>
			) }
		</>
	);
}
export default Editor;
