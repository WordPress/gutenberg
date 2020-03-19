/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useState,
	useMemo,
} from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	SlotFillProvider,
	DropZoneProvider,
	Popover,
	FocusReturnProvider,
} from '@wordpress/components';
import { EntityProvider } from '@wordpress/core-data';
import {
	__experimentalEditorSkeleton as EditorSkeleton,
	__experimentalFullscreenMode as FullscreenMode,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';

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

	return template ? (
		<>
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
									<EditorSkeleton
										sidebar={ ! isMobile && <Sidebar /> }
										header={ <Header /> }
										content={
											<>
												<Notices />
												<Popover.Slot name="block-toolbar" />
												<BlockEditor />
											</>
										}
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
