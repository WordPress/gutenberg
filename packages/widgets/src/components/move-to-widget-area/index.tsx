import {
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moveTo } from '@wordpress/icons';

interface WidgetArea {
	id: string;
	name: string;
	description?: string;
}

interface MoveToWidgetAreaProps {
	currentWidgetAreaId?: string;
	widgetAreas: WidgetArea[];
	onSelect: ( widgetAreaId: string ) => void;
}

export default function MoveToWidgetArea( {
	currentWidgetAreaId,
	widgetAreas,
	onSelect,
}: MoveToWidgetAreaProps ) {
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
									value={ currentWidgetAreaId ?? '' }
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
