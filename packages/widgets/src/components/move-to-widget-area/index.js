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

export default function MoveToWidgetArea( {
	currentWidgetArea,
	widgetAreas,
	onSelect,
} ) {
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
									choices={ widgetAreas.map(
										( widgetArea ) => ( {
											value: widgetArea.id,
											label: widgetArea.name,
											info: widgetArea.description,
										} )
									) }
									value={ currentWidgetArea?.id }
									onSelect={ ( value ) => {
										onSelect( value );
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
