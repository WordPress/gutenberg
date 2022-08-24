/**
 * WordPress dependencies
 */
import {
	MenuGroup,
	MenuItem,
	MenuItemsChoice,
	DropdownMenu,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { forwardRef, useEffect, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';
import useNavigationEntities from '../use-navigation-entities';

function NavigationMenuSelector(
	{
		currentMenuId,
		onSelectNavigationMenu,
		onSelectClassicMenu,
		onCreateNew,
		showManageActions = false,
		actionLabel,
		toggleProps = {},
	},
	forwardedRef
) {
	/* translators: %s: The name of a menu. */
	const createActionLabel = __( "Create from '%s'" );

	toggleProps = {
		...toggleProps,
		className: 'wp-block-navigation__navigation-selector-button',
	};

	actionLabel = actionLabel || createActionLabel;

	const { menus: classicMenus } = useNavigationEntities();

	const {
		navigationMenus,
		canUserCreateNavigationMenu,
		canUserUpdateNavigationMenu,
		canSwitchNavigationMenu,
	} = useNavigationMenu();

	const [ selectorLabel, setSelectorLabel ] = useState( '' );

	const menuChoices = useMemo( () => {
		return (
			navigationMenus?.map( ( { id, title } ) => {
				const label = decodeEntities( title.rendered );
				if ( id === currentMenuId ) {
					setSelectorLabel( label );
				}
				return {
					value: id,
					label,
					ariaLabel: sprintf( actionLabel, label ),
				};
			} ) || []
		);
	}, [ currentMenuId, navigationMenus ] );

	const hasNavigationMenus = !! navigationMenus?.length;
	const hasClassicMenus = !! classicMenus?.length;
	const showNavigationMenus = !! canSwitchNavigationMenu;
	const showClassicMenus = !! canUserCreateNavigationMenu;
	const hasManagePermissions =
		canUserCreateNavigationMenu || canUserUpdateNavigationMenu;

	useEffect( () => {
		if ( ! ( hasNavigationMenus && hasClassicMenus ) ) {
			setSelectorLabel( __( 'No menus. Create one?' ) );
		} else if ( currentMenuId === null ) {
			setSelectorLabel( __( 'Select another menu' ) );
		}
	}, [ currentMenuId, hasNavigationMenus, hasClassicMenus ] );

	// Show the selector if:
	// - has switch or create permissions and there are block or classic menus.
	// - user has create or update permissions and component should show the menu actions.
	const showSelectMenus =
		( ( canSwitchNavigationMenu || canUserCreateNavigationMenu ) &&
			( hasNavigationMenus || hasClassicMenus ) ) ||
		( hasManagePermissions && showManageActions );

	if ( ! showSelectMenus ) {
		return null;
	}

	return (
		<DropdownMenu
			className="wp-block-navigation__navigation-selector"
			ref={ forwardedRef }
			label={ selectorLabel }
			text={ selectorLabel }
			icon={ null }
			toggleProps={ toggleProps }
		>
			{ ( { onClose } ) => (
				<>
					{ showNavigationMenus && hasNavigationMenus && (
						<MenuGroup label={ __( 'Menus' ) }>
							<MenuItemsChoice
								value={ currentMenuId }
								onSelect={ ( menuId ) => {
									onClose();
									onSelectNavigationMenu( menuId );
								} }
								choices={ menuChoices }
							/>
						</MenuGroup>
					) }
					{ showClassicMenus && hasClassicMenus && (
						<MenuGroup label={ __( 'Classic Menus' ) }>
							{ classicMenus?.map( ( menu ) => {
								const label = decodeEntities( menu.name );
								return (
									<MenuItem
										onClick={ () => {
											onClose();
											onSelectClassicMenu( menu );
										} }
										key={ menu.id }
										aria-label={ sprintf(
											createActionLabel,
											label
										) }
									>
										{ label }
									</MenuItem>
								);
							} ) }
						</MenuGroup>
					) }

					{ showManageActions && hasManagePermissions && (
						<MenuGroup label={ __( 'Tools' ) }>
							{ canUserCreateNavigationMenu && (
								<MenuItem onClick={ onCreateNew }>
									{ __( 'Create new menu' ) }
								</MenuItem>
							) }
						</MenuGroup>
					) }
				</>
			) }
		</DropdownMenu>
	);
}

export default forwardRef( NavigationMenuSelector );
