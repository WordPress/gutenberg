/**
 * WordPress dependencies
 */

import {
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function MenuSelector( { activeMenuId, menus, onSelectMenu } ) {
	return (
		<DropdownMenu
			icon={ null }
			toggleProps={ {
				showTooltip: false,
				children: __( 'Select menu' ),
				isTertiary: true,
				disabled: ! menus,
				__experimentalIsFocusable: true,
			} }
		>
			{ () => (
				<MenuGroup>
					<MenuItemsChoice
						value={ activeMenuId }
						onSelect={ onSelectMenu }
						choices={ menus.map( ( menu ) => ( {
							value: menu.id,
							label: menu.name,
						} ) ) }
					/>
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
