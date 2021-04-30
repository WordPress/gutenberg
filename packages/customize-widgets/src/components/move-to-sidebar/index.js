/**
 * External dependencies
 */
import { without } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moveTo } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	useSidebarControls,
	useActiveSidebarControl,
} from '../sidebar-controls';
import { useFocusControl } from '../focus-control';

export default function MoveToSidebar( { widgetId } ) {
	const sidebarControls = useSidebarControls();
	const activeSidebarControl = useActiveSidebarControl();
	const [ , focusWidget ] = useFocusControl();

	function moveToSidebar( sidebarControlId ) {
		const newSidebarControl = sidebarControls.find(
			( sidebarControl ) => sidebarControl.id === sidebarControlId
		);

		const oldSetting = activeSidebarControl.setting;
		const newSetting = newSidebarControl.setting;

		oldSetting( without( oldSetting(), widgetId ) );
		newSetting( [ ...newSetting(), widgetId ] );

		focusWidget( widgetId );
	}

	return (
		<ToolbarGroup>
			<ToolbarItem>
				{ ( toggleProps ) => (
					<DropdownMenu
						icon={ moveTo }
						label={ __( 'Move to widget area' ) }
						toggleProps={ toggleProps }
					>
						{ ( { onClose } ) => (
							<MenuGroup label={ __( 'Move to' ) }>
								<MenuItemsChoice
									choices={ sidebarControls.map(
										( sidebarControl ) => ( {
											value: sidebarControl.id,
											label: sidebarControl.params.label,
											info:
												sidebarControl.params
													.description,
										} )
									) }
									value={ activeSidebarControl?.id }
									onSelect={ ( sidebarControlId ) => {
										moveToSidebar( sidebarControlId );
										onClose();
									} }
								/>
							</MenuGroup>
						) }
					</DropdownMenu>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
}
