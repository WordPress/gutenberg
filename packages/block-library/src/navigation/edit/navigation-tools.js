/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem, DropdownMenu } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';

function NavigationTools( {
	onCreateNew,
	createNavigationMenuIsSuccess,
	createNavigationMenuIsError,
} ) {
	const [ isCreatingMenu, setIsCreatingMenu ] = useState( false );

	const { canUserCreateNavigationMenu } = useNavigationMenu();

	useEffect( () => {
		if (
			isCreatingMenu &&
			( createNavigationMenuIsSuccess || createNavigationMenuIsError )
		) {
			setIsCreatingMenu( false );
		}
	}, [
		createNavigationMenuIsSuccess,
		createNavigationMenuIsError,
		isCreatingMenu,
	] );

	const NavigationMenuSelectorDropdown = (
		<DropdownMenu
			label={ __( 'Navigation Tools' ) }
			icon={ moreVertical }
			toggleProps={ { isSmall: 'true' } }
		>
			{ ( { onClose } ) =>
				canUserCreateNavigationMenu && (
					<MenuGroup>
						<MenuItem
							disabled={ isCreatingMenu }
							onClick={ () => {
								onClose();
								onCreateNew();
								setIsCreatingMenu( true );
							} }
						>
							{ __( 'Create new menu' ) }
						</MenuItem>
					</MenuGroup>
				)
			}
		</DropdownMenu>
	);

	return NavigationMenuSelectorDropdown;
}

export default NavigationTools;
