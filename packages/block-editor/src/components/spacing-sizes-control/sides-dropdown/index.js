/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getSupportedMenuItems, VIEWS } from '../utils';

export default function SidesDropdown( { onChange, sides, value } ) {
	if ( ! sides || ! sides.length ) {
		return;
	}

	const menuGroups = getSupportedMenuItems( sides );
	const sideIcon = [ VIEWS.linked, VIEWS.custom ].includes( value )
		? menuGroups.secondaryItems[ value ].icon
		: menuGroups.primaryItems[ value ].icon;

	return (
		<DropdownMenu
			icon={ sideIcon }
			className="component-spacing-sizes-control__dropdown"
			toggleProps={ { isSmall: true } }
		>
			{ ( { onClose } ) => {
				return (
					<>
						{ Object.entries( menuGroups ).map(
							( [ groupName, menuItems ] ) => (
								<MenuGroup key={ groupName }>
									{ Object.entries( menuItems ).map(
										( [ slug, { label, icon } ] ) => {
											const isSelected = value === slug;
											return (
												<MenuItem
													key={ slug }
													icon={ icon }
													iconPosition="left"
													isSelected={ isSelected }
													role="menuitemradio"
													onClick={ () => {
														onChange( slug );
														onClose();
													} }
													suffix={
														isSelected
															? check
															: undefined
													}
												>
													{ label }
												</MenuItem>
											);
										}
									) }
								</MenuGroup>
							)
						) }
					</>
				);
			} }
		</DropdownMenu>
	);
}
