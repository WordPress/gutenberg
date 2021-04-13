/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moveTo } from '@wordpress/icons';

export default function MoveToWidgetArea( {
	currentWidgetArea,
	widgetAreas,
	onSelect,
} ) {
	return (
		<DropdownMenu icon={ moveTo } label={ __( 'Move to widget area' ) }>
			{ ( { onClose } ) => (
				<MenuGroup label={ __( 'Move to' ) }>
					<MenuItemsChoice
						choices={ widgetAreas.map( ( widgetArea ) => ( {
							value: widgetArea.id,
							label: widgetArea.name,
							info: widgetArea.description,
						} ) ) }
						value={ currentWidgetArea?.id }
						onSelect={ ( value ) => {
							onSelect( value );
							onClose();
						} }
					/>
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
