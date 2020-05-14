/**
 * WordPress dependencies
 */
import {
	DropZoneProvider,
	FocusReturnProvider,
	Popover,
	SlotFillProvider,
	TabPanel,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MenusEditor from '../menus-editor';
import MenuLocationsEditor from '../menu-locations-editor';
import useMenus from './use-menus.js';

export default function Layout( { blockEditorSettings } ) {
	const [ menus, setMenus, currentMenu, setCurrentMenu ] = useMenus();

	return (
		<>
			<SlotFillProvider>
				<DropZoneProvider>
					<FocusReturnProvider>
						{ /* <Notices /> */ }
						<TabPanel
							className="edit-navigation-layout__tab-panel"
							tabs={ [
								{
									name: 'menus',
									title: __( 'Edit Navigation' ),
								},
								{
									name: 'menu-locations',
									title: __( 'Manage Locations' ),
								},
							] }
						>
							{ ( tab ) => (
								<>
									{ tab.name === 'menus' && (
										<MenusEditor
											blockEditorSettings={
												blockEditorSettings
											}
											menus={ menus }
											setMenus={ setMenus }
											currentMenu={ currentMenu }
											setCurrentMenu={ setCurrentMenu }
										/>
									) }
									{ tab.name === 'menu-locations' && (
										<MenuLocationsEditor menus={ menus } />
									) }
								</>
							) }
						</TabPanel>
						<Popover.Slot />
					</FocusReturnProvider>
				</DropZoneProvider>
			</SlotFillProvider>
		</>
	);
}
