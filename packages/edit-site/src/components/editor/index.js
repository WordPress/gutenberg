/**
 * WordPress dependencies
 */
import { useEffect, useState, useMemo, useCallback } from '@wordpress/element';
import { AsyncModeProvider, useSelect, useDispatch } from '@wordpress/data';
import {
	SlotFillProvider,
	Popover,
	Button,
	Notice,
} from '@wordpress/components';
import { EntityProvider, store as coreStore } from '@wordpress/core-data';
import { BlockContextProvider, BlockBreadcrumb } from '@wordpress/block-editor';
import {
	FullscreenMode,
	InterfaceSkeleton,
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';
import {
	EditorNotices,
	EntitiesSavedStates,
	UnsavedChangesWarning,
	store as editorStore,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { PluginArea } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import Header from '../header';
import { SidebarComplementaryAreaFills } from '../sidebar';
import BlockEditor from '../block-editor';
import KeyboardShortcuts from '../keyboard-shortcuts';
import GlobalStylesProvider from './global-styles-provider';
import NavigationSidebar from '../navigation-sidebar';
import URLQueryController from '../url-query-controller';
import InserterSidebar from '../secondary-sidebar/inserter-sidebar';
import ListViewSidebar from '../secondary-sidebar/list-view-sidebar';
import { store as editSiteStore } from '../../store';

const interfaceLabels = {
	secondarySidebar: __( 'Block Library' ),
	drawer: __( 'Navigation Sidebar' ),
};

function Editor( { initialSettings } ) {
	const {
		isInserterOpen,
		isListViewOpen,
		sidebarIsOpened,
		settings,
		entityId,
		templateType,
		page,
		template,
		isNavigationOpen,
	} = useSelect( ( select ) => {
		const {
			isInserterOpened,
			isListViewOpened,
			getSettings,
			getEditedPostType,
			getEditedPostId,
			getPage,
			isNavigationOpened,
		} = select( editSiteStore );
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
				? select( coreStore ).getEntityRecord(
						'postType',
						postType,
						postId
				  )
				: null,
			entityId: postId,
			isNavigationOpen: isNavigationOpened(),
		};
	}, [] );
	const { updateEditorSettings } = useDispatch( editorStore );
	const { setPage, setIsInserterOpened, updateSettings } = useDispatch(
		editSiteStore
	);
	useEffect( () => {
		updateSettings( initialSettings );
	}, [] );

	// Keep the defaultTemplateTypes in the core/editor settings too,
	// so that they can be selected with core/editor selectors in any editor.
	// This is needed because edit-site doesn't initialize with EditorProvider,
	// which internally uses updateEditorSettings as well.
	const { defaultTemplateTypes, defaultTemplatePartAreas } = settings;
	useEffect( () => {
		updateEditorSettings( {
			defaultTemplateTypes,
			defaultTemplatePartAreas,
		} );
	}, [ defaultTemplateTypes, defaultTemplatePartAreas ] );

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

	// Don't render the Editor until the settings are set and loaded
	if ( ! settings?.siteUrl ) {
		return null;
	}

	const secondarySidebar = () => {
		if ( isInserterOpen ) {
			return <InserterSidebar />;
		}
		if ( isListViewOpen ) {
			return (
				<AsyncModeProvider value="true">
					<ListViewSidebar />
				</AsyncModeProvider>
			);
		}
		return null;
	};

	return (
		<>
			<URLQueryController />
			<FullscreenMode isActive />
			<UnsavedChangesWarning />
			<SlotFillProvider>
				<EntityProvider kind="root" type="site">
					<EntityProvider
						kind="postType"
						type={ templateType }
						id={ entityId }
					>
						<EntityProvider
							kind="postType"
							type="wp_global_styles"
							id={
								settings.__experimentalGlobalStylesUserEntityId
							}
						>
							<BlockContextProvider value={ blockContext }>
								<GlobalStylesProvider
									baseStyles={
										settings.__experimentalGlobalStylesBaseStyles
									}
								>
									<KeyboardShortcuts.Register />
									<SidebarComplementaryAreaFills />
									<InterfaceSkeleton
										labels={ interfaceLabels }
										drawer={ <NavigationSidebar /> }
										secondarySidebar={ secondarySidebar() }
										sidebar={
											sidebarIsOpened && (
												<ComplementaryArea.Slot scope="core/edit-site" />
											)
										}
										header={
											<Header
												openEntitiesSavedStates={
													openEntitiesSavedStates
												}
											/>
										}
										content={
											<>
												<EditorNotices />
												{ template && (
													<BlockEditor
														setIsInserterOpen={
															setIsInserterOpened
														}
													/>
												) }
												{ ! template &&
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
												<KeyboardShortcuts />
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
									/>
									<Popover.Slot />
									<PluginArea />
								</GlobalStylesProvider>
							</BlockContextProvider>
						</EntityProvider>
					</EntityProvider>
				</EntityProvider>
			</SlotFillProvider>
		</>
	);
}
export default Editor;
