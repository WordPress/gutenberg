/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useState,
	useMemo,
	useEffect,
	useCallback,
} from '@wordpress/element';
import { useSelect } from '@wordpress/data';
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
import { FullscreenMode, InterfaceSkeleton } from '@wordpress/interface';
import { EntitiesSavedStates } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { PluginArea } from '@wordpress/plugins';
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import Header from '../header';
import Sidebar from '../sidebar';
import BlockEditor from '../block-editor';
import KeyboardShortcuts from '../keyboard-shortcuts';

const Context = createContext();
export function useEditorContext() {
	return useContext( Context );
}

const interfaceLabels = {
	leftSidebar: __( 'Block Library' ),
};

function Editor( { settings: _settings } ) {
	const [ isInserterOpen, setIsInserterOpen ] = useState( false );
	const isMobile = useViewportMatch( 'medium', '<' );
	const [ settings, setSettings ] = useState( _settings );
	const template = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecord(
				'postType',
				settings.templateType,
				settings.templateId
			),
		[ settings.templateType, settings.templateId ]
	);

	const context = useMemo( () => ( { settings, setSettings } ), [
		settings,
		setSettings,
	] );

	const {
		isFullscreenActive,
		focusMode,
		deviceType,
		hasFixedToolbar,
	} = useSelect( ( select ) => {
		const { isFeatureActive, __experimentalGetPreviewDeviceType } = select(
			'core/edit-site'
		);
		return {
			hasFixedToolbar: isFeatureActive( 'fixedToolbar' ),
			isFullscreenActive: isFeatureActive( 'fullscreenMode' ),
			focusMode: isFeatureActive( 'focusMode' ),
			deviceType: __experimentalGetPreviewDeviceType(),
		};
	}, [] );

	useEffect( () => {
		setSettings( {
			...settings,
			focusMode,
			hasFixedToolbar,
		} );
	}, [ focusMode, hasFixedToolbar ] );

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
		() => setIsEntitiesSavedStatesOpen( false ),
		[]
	);

	const blockContext = useMemo( () => {
		if ( ! settings.page.context.queryContext )
			return settings.page.context;

		return {
			...settings.page.context,
			queryContext: [
				settings.page.context.queryContext,
				( newQueryContext ) =>
					setSettings( ( prevSettings ) => ( {
						...prevSettings,
						page: {
							...prevSettings.page,
							context: {
								...prevSettings.page.context,
								queryContext: {
									...prevSettings.page.context.queryContext,
									...newQueryContext,
								},
							},
						},
					} ) ),
			],
		};
	}, [ settings.page.context ] );
	return template ? (
		<>
			<EditorStyles styles={ settings.styles } />
			<FullscreenMode isActive={ isFullscreenActive } />
			<SlotFillProvider>
				<DropZoneProvider>
					<EntityProvider kind="root" type="site">
						<EntityProvider
							kind="postType"
							type={ settings.templateType }
							id={ settings.templateId }
						>
							<BlockContextProvider value={ blockContext }>
								<Context.Provider value={ context }>
									<FocusReturnProvider>
										<KeyboardShortcuts.Register />
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
												! isMobile && <Sidebar />
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
													<BlockEditor />
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
								</Context.Provider>
							</BlockContextProvider>
						</EntityProvider>
					</EntityProvider>
				</DropZoneProvider>
			</SlotFillProvider>
		</>
	) : null;
}
export default Editor;
