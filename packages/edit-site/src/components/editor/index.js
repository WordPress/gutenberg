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
	navigateRegions,
} from '@wordpress/components';
import { EntityProvider } from '@wordpress/core-data';

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
	return template ? (
		<SlotFillProvider>
			<DropZoneProvider>
				<EntityProvider
					kind="postType"
					type={ settings.templateType }
					id={ settings.templateId }
				>
					<Context.Provider value={ context }>
						<Notices />
						<Header />
						<Sidebar />
						<BlockEditor />
						<Popover.Slot />
					</Context.Provider>
				</EntityProvider>
			</DropZoneProvider>
		</SlotFillProvider>
	) : null;
}
export default navigateRegions( Editor );
