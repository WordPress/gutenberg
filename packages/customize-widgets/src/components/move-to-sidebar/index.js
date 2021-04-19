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

export default function MoveToSidebar( {
	currentSidebar,
	sidebars,
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
									choices={ sidebars.map( ( sidebar ) => ( {
										value: sidebar.id,
										label: sidebar.name,
										info: sidebar.description,
									} ) ) }
									value={ currentSidebar?.id }
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
