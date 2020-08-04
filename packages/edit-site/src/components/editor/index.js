/**
 * WordPress dependencies
 */
import { useState, useMemo, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	SlotFillProvider,
	DropZoneProvider,
	Popover,
	FocusReturnProvider,
	Button,
} from '@wordpress/components';
import { EntityProvider } from '@wordpress/core-data';
import {
	BlockContextProvider,
	BlockSelectionClearer,
	BlockBreadcrumb,
	__unstableEditorStyles as EditorStyles,
	__experimentalUseResizeCanvas as useResizeCanvas,
	__experimentalLibrary as Library,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import {
	FullscreenMode,
	InterfaceSkeleton,
	ComplementaryArea,
} from '@wordpress/interface';
import { EntitiesSavedStates } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { PluginArea } from '@wordpress/plugins';
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import Header from '../header';
import { SidebarComplementaryAreaFills } from '../sidebar';
import BlockEditor from '../block-editor';
import KeyboardShortcuts from '../keyboard-shortcuts';

const interfaceLabels = {
	leftSidebar: __( 'Block Library' ),
};

function Editor() {
	const [ isInserterOpen, setIsInserterOpen ] = useState( false );
	const isMobile = useViewportMatch( 'medium', '<' );

	const {
		isFullscreenActive,
		deviceType,
		sidebarIsOpened,
		settings,
		entityId,
		templateType,
		page,
		template,
		select,
	} = useSelect( ( _select ) => {
		const {
			isFeatureActive,
			__experimentalGetPreviewDeviceType,
			getSettings,
			getTemplateId,
			getTemplatePartId,
			getTemplateType,
			getPage,
		} = _select( 'core/edit-site' );
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
			isFullscreenActive: isFeatureActive( 'fullscreenMode' ),
			deviceType: __experimentalGetPreviewDeviceType(),
			sidebarIsOpened: !! _select(
				'core/interface'
			).getActiveComplementaryArea( 'core/edit-site' ),
			settings: getSettings(),
			templateType: _templateType,
			page: getPage(),
			template: _templateType
				? _select( 'core' ).getEntityRecord(
						'postType',
						_templateType,
						_entityId
				  )
				: null,
			select: _select,
			entityId: _entityId,
		};
	}, [] );
	const { editEntityRecord } = useDispatch( 'core' );
	const { setPage } = useDispatch( 'core/edit-site' );

	const inlineStyles = useResizeCanvas( deviceType );

	const [
		isEntitiesSavedStatesOpen,
		setIsEntitiesSavedStatesOpen,
	] = useState( false );
	const openEntitiesSavedStates = useCallback(
		() => setIsEntitiesSavedStatesOpen( true ),
		[]
	);
	const closeEntitiesSavedStates = useCallback(
		( entitiesToSave ) => {
			if ( entitiesToSave ) {
				const { getEditedEntityRecord } = select( 'core' );
				entitiesToSave.forEach( ( { kind, name, key } ) => {
					const record = getEditedEntityRecord( kind, name, key );
					editEntityRecord( kind, name, key, {
						status: 'publish',
						title: record.slug,
					} );
				} );
			}
			setIsEntitiesSavedStatesOpen( false );
		},
		[ select ]
	);

	// Set default query for misplaced Query Loop blocks, and
	// provide the root `queryContext` for top-level Query Loop
	// and Query Pagination blocks.
	const blockContext = useMemo(
		() => ( {
			...page?.context,
			query: page?.context.query || { categoryIds: [] },
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

	return (
		<>
			<EditorStyles styles={ settings.styles } />
			<FullscreenMode isActive={ isFullscreenActive } />
			<SlotFillProvider>
				<DropZoneProvider>
					<EntityProvider kind="root" type="site">
						<EntityProvider
							kind="postType"
							type={ templateType }
							id={ entityId }
						>
							<BlockContextProvider value={ blockContext }>
								<FocusReturnProvider>
									<KeyboardShortcuts.Register />
									<SidebarComplementaryAreaFills />
									<InterfaceSkeleton
										labels={ interfaceLabels }
										leftSidebar={
											isInserterOpen && (
												<div className="edit-site-editor__inserter-panel">
													<div className="edit-site-editor__inserter-panel-header">
														<Button
															icon={ close }
															onClick={ () =>
																setIsInserterOpen(
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
																	setIsInserterOpen(
																		false
																	);
																}
															} }
														/>
													</div>
												</div>
											)
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
												isInserterOpen={
													isInserterOpen
												}
												onToggleInserter={ () =>
													setIsInserterOpen(
														! isInserterOpen
													)
												}
											/>
										}
										content={
											<BlockSelectionClearer
												className="edit-site-visual-editor"
												style={ inlineStyles }
											>
												<Notices />
												<Popover.Slot name="block-toolbar" />
												{ template && (
													<BlockEditor
														setIsInserterOpen={
															setIsInserterOpen
														}
													/>
												) }
												<KeyboardShortcuts />
											</BlockSelectionClearer>
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
								</FocusReturnProvider>
							</BlockContextProvider>
						</EntityProvider>
					</EntityProvider>
				</DropZoneProvider>
			</SlotFillProvider>
		</>
	);
}
export default Editor;
