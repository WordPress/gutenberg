/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useState,
	useMemo,
} from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	SlotFillProvider,
	DropZoneProvider,
	Popover,
	FocusReturnProvider,
} from '@wordpress/components';
import { EntityProvider } from '@wordpress/core-data';
import {
	BlockSelectionClearer,
	BlockBreadcrumb,
	__unstableEditorStyles as EditorStyles,
	__experimentalUseResizeCanvas as useResizeCanvas,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { FullscreenMode, InterfaceSkeleton } from '@wordpress/interface';
import { EntitiesSavedStates } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import Header from '../header';
import Sidebar from '../sidebar';
import BlockEditor from '../block-editor';

const Context = createContext();
export function useEditorContext() {
	return useContext( Context );
}

function Editor( { settings: _settings } ) {
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
	const isEntitiesSavedStatesOpen = useSelect(
		( select ) => select( 'core/edit-site' ).isEntitiesSavedStatesOpen(),
		[]
	);
	const { closeEntitiesSavedStates } = useDispatch( 'core/edit-site' );
	const context = useMemo( () => ( { settings, setSettings } ), [
		settings,
		setSettings,
	] );

	const { isFullscreenActive } = useSelect( ( select ) => {
		return {
			isFullscreenActive: select( 'core/edit-site' ).isFeatureActive(
				'fullscreenMode'
			),
		};
	}, [] );

	const deviceType = useSelect( ( select ) => {
		return select( 'core/edit-site' ).__experimentalGetPreviewDeviceType();
	}, [] );

	const inlineStyles = useResizeCanvas( deviceType );

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
							<Context.Provider value={ context }>
								<FocusReturnProvider>
									<InterfaceSkeleton
										sidebar={ ! isMobile && <Sidebar /> }
										header={ <Header /> }
										content={
											<BlockSelectionClearer
												style={ inlineStyles }
											>
												<Notices />
												<Popover.Slot name="block-toolbar" />
												<BlockEditor />
											</BlockSelectionClearer>
										}
										actions={
											<EntitiesSavedStates
												isOpen={
													isEntitiesSavedStatesOpen
												}
												closePanel={
													closeEntitiesSavedStates
												}
											/>
										}
										footer={ <BlockBreadcrumb /> }
									/>
									<Popover.Slot />
								</FocusReturnProvider>
							</Context.Provider>
						</EntityProvider>
					</EntityProvider>
				</DropZoneProvider>
			</SlotFillProvider>
		</>
	) : null;
}
export default Editor;
