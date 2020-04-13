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
import Notices from '../notices';
import MenusEditor from '../menus-editor';
import MenuLocationsEditor from '../menu-locations-editor';
import Notices from '../notices';

export default function Layout( { blockEditorSettings } ) {
	return (
		<>
			<SlotFillProvider>
				<DropZoneProvider>
					<FocusReturnProvider>
						<Notices />
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
										/>
									) }
									{ tab.name === 'menu-locations' && (
										<MenuLocationsEditor />
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
