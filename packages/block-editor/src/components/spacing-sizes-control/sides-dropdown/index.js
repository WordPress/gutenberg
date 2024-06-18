/**
 * WordPress dependencies
 */
import { DropdownMenu, Icon, MenuGroup, MenuItem } from '@wordpress/components';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getSupportedMenuItems, VIEWS } from '../utils';

const checkIcon = <Icon icon={ check } size={ 24 } />;

export default function SidesDropdown( {
	label: labelProp,
	onChange,
	sides,
	value,
} ) {
	if ( ! sides || ! sides.length ) {
		return;
	}

	const supportedItems = getSupportedMenuItems( sides );
	const sideIcon = supportedItems[ value ].icon;
	const { custom: customItem, ...menuItems } = supportedItems;

	return (
		<DropdownMenu
			icon={ sideIcon }
			label={ labelProp }
			className="spacing-sizes-control__dropdown"
			toggleProps={ { size: 'small' } }
		>
			{ ( { onClose } ) => {
				return (
					<>
						<MenuGroup>
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
													? checkIcon
													: undefined
											}
										>
											{ label }
										</MenuItem>
									);
								}
							) }
						</MenuGroup>
						{ !! customItem && (
							<MenuGroup>
								<MenuItem
									icon={ customItem.icon }
									iconPosition="left"
									isSelected={ value === VIEWS.custom }
									role="menuitemradio"
									onClick={ () => {
										onChange( VIEWS.custom );
										onClose();
									} }
									suffix={
										value === VIEWS.custom
											? checkIcon
											: undefined
									}
								>
									{ customItem.label }
								</MenuItem>
							</MenuGroup>
						) }
					</>
				);
			} }
		</DropdownMenu>
	);
}
