/**
 * WordPress dependencies
 */
import { useEffect, useState, useMemo, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	SlotFillProvider,
	DropZoneProvider,
	Popover,
	Button,
} from '@wordpress/components';
import { EntityProvider } from '@wordpress/core-data';
import {
	BlockContextProvider,
	BlockBreadcrumb,
	__experimentalLibrary as Library,
} from '@wordpress/block-editor';
import {
	FullscreenMode,
	InterfaceSkeleton,
	ComplementaryArea,
} from '@wordpress/interface';
import { EntitiesSavedStates, UnsavedChangesWarning } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { PluginArea } from '@wordpress/plugins';
import { close } from '@wordpress/icons';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import Header from '../header';
import { SidebarComplementaryAreaFills } from '../sidebar';
import BlockEditor from '../block-editor';
import KeyboardShortcuts from '../keyboard-shortcuts';
import GlobalStylesProvider from './global-styles-provider';
import NavigationSidebar from '../navigation-sidebar';
import URLQueryController from '../url-query-controller';
import PopoverWrapper from './popover-wrapper';

const interfaceLabels = {
	secondarySidebar: __( 'Block Library' ),
	drawer: __( 'Navigation Sidebar' ),
};

function Editor() {
	const {
		isFullscreenActive,
		isInserterOpen,
		sidebarIsOpened,
		settings,
		entityId,
		templateType,
		page,
		template,
		isNavigationOpen,
	} = useSelect( ( select ) => {
		const {
			isFeatureActive,
			isInserterOpened,
			getSettings,
			getTemplateId,
			getTemplatePartId,
			getTemplateType,
			getPage,
			isNavigationOpened,
		} = select( 'core/edit-site' );
		const _templateId = getTemplateId();
		const _templatePartId = getTemplatePartId();
		const _templateType = getTemplateType();

		// The currently selected entity to display. Typically template or template part.
		let _entityId;
		if ( _templateType ) {
			_entityId =
				_templateType === 'wp_template' ? _templateId : _templatePartId;
		}

		return {
			isInserterOpen: isInserterOpened(),
			isFullscreenActive: isFeatureActive( 'fullscreenMode' ),
			sidebarIsOpened: !! select(
				'core/interface'
			).getActiveComplementaryArea( 'core/edit-site' ),
			settings: getSettings(),
			templateType: _templateType,
			page: getPage(),
			template:
				_templateType && _entityId
					? select( 'core' ).getEntityRecord(
							'postType',
							_templateType,
							_entityId
					  )
					: null,
			entityId: _entityId,
			isNavigationOpen: isNavigationOpened(),
		};
	}, [] );
	const { updateEditorSettings } = useDispatch( 'core/editor' );
	const { setPage, setIsInserterOpened } = useDispatch( 'core/edit-site' );

	// Keep the defaultTemplateTypes in the core/editor settings too,
	// so that they can be selected with core/editor selectors in any editor.
	// This is needed because edit-site doesn't initialize with EditorProvider,
	// which internally uses updateEditorSettings as well.
	const { defaultTemplateTypes } = settings;
	useEffect( () => {
		updateEditorSettings( { defaultTemplateTypes } );
	}, [ defaultTemplateTypes ] );

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

	// Set default query for misplaced Query Loop blocks, and
	// provide the root `queryContext` for top-level Query Loop
	// and Query Pagination blocks.
	const blockContext = useMemo(
		() => ( {
			...page?.context,
			query: page?.context.query || { categoryIds: [], tagIds: [] },
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

	const isMobile = useViewportMatch( 'medium', '<' );

	return (
		<>
			<URLQueryController />
			<FullscreenMode isActive={ isFullscreenActive } />
			<UnsavedChangesWarning />
			<SlotFillProvider>
				<DropZoneProvider>
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
											secondarySidebar={
												isInserterOpen ? (
													<PopoverWrapper
														className="edit-site-editor__inserter-panel-popover-wrapper"
														onClose={ () =>
															setIsInserterOpened(
																false
															)
														}
													>
														<div className="edit-site-editor__inserter-panel">
															<div className="edit-site-editor__inserter-panel-header">
																<Button
																	icon={
																		close
																	}
																	onClick={ () =>
																		setIsInserterOpened(
																			false
																		)
																	}
																/>
															</div>
															<div className="edit-site-editor__inserter-panel-content">
																<Library
																	showInserterHelpPanel
																	onSelect={ () => {
																		if (
																			isMobile
																		) {
																			setIsInserterOpened(
																				false
																			);
																		}
																	} }
																/>
															</div>
														</div>
													</PopoverWrapper>
												) : null
											}
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
													<Notices />
													{ template && (
														<BlockEditor
															setIsInserterOpen={
																setIsInserterOpened
															}
														/>
													) }
													<KeyboardShortcuts />
												</>
											}
											actions={
												<>
													<EntitiesSavedStates
														isOpen={
															isEntitiesSavedStatesOpen
														}
														close={
															closeEntitiesSavedStates
														}
													/>
													{ ! isEntitiesSavedStatesOpen && (
														<div className="edit-site-editor__toggle-save-panel">
															<Button
																isSecondary
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
				</DropZoneProvider>
			</SlotFillProvider>
		</>
	);
}
export default Editor;
