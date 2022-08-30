/**
 * WordPress dependencies
 */
import {
	MenuGroup,
	MenuItem,
	MenuItemsChoice,
	DropdownMenu,
} from '@wordpress/components';
import { Icon, chevronUp, chevronDown } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { useEffect, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';
import useNavigationEntities from '../use-navigation-entities';

function NavigationMenuSelector( {
	currentMenuId,
	onSelectNavigationMenu,
	onSelectClassicMenu,
	onCreateNew,
	actionLabel,
	createNavigationMenuIsSuccess,
	toggleProps = {},
} ) {
	/* translators: %s: The name of a menu. */
	const createActionLabel = __( "Create from '%s'" );

	const [ selectorLabel, setSelectorLabel ] = useState( '' );
	const [ isPressed, setIsPressed ] = useState( false );
	const [ enableOptions, setEnableOptions ] = useState( false );
	const [ isCreatingMenu, setIsCreatingMenu ] = useState( false );

	actionLabel = actionLabel || createActionLabel;

	const { menus: classicMenus } = useNavigationEntities();

	const {
		navigationMenus,
		hasResolvedNavigationMenus,
		isNavigationMenuResolved,
		canUserCreateNavigationMenu,
		canSwitchNavigationMenu,
	} = useNavigationMenu();

	const menuChoices = useMemo( () => {
		return (
			navigationMenus?.map( ( { id, title } ) => {
				const label = decodeEntities( title.rendered );
				if ( id === currentMenuId && ! isCreatingMenu ) {
					setSelectorLabel( label );
					setEnableOptions(
						( canSwitchNavigationMenu ||
							canUserCreateNavigationMenu ) &&
							hasResolvedNavigationMenus &&
							( ! isCreatingMenu ||
								createNavigationMenuIsSuccess )
					);
				}
				return {
					value: id,
					label,
					ariaLabel: sprintf( actionLabel, label ),
				};
			} ) || []
		);
	}, [
		currentMenuId,
		navigationMenus,
		createNavigationMenuIsSuccess,
		isNavigationMenuResolved,
		hasResolvedNavigationMenus,
	] );

	const hasNavigationMenus = !! navigationMenus?.length;
	const hasClassicMenus = !! classicMenus?.length;
	const showNavigationMenus = !! canSwitchNavigationMenu;
	const showClassicMenus = !! canUserCreateNavigationMenu;

	useEffect( () => {
		if ( ! hasResolvedNavigationMenus ) {
			setSelectorLabel( __( 'Loading options …' ) );
		} else if ( ! hasNavigationMenus && hasResolvedNavigationMenus ) {
			setSelectorLabel( __( 'No menus. Create one?' ) );
			setEnableOptions(
				( canSwitchNavigationMenu || canUserCreateNavigationMenu ) &&
					hasResolvedNavigationMenus &&
					( ! isCreatingMenu || createNavigationMenuIsSuccess )
			);
		} else if ( hasResolvedNavigationMenus && currentMenuId === null ) {
			setSelectorLabel( __( 'Select another menu' ) );
			setEnableOptions(
				( canSwitchNavigationMenu || canUserCreateNavigationMenu ) &&
					hasResolvedNavigationMenus &&
					( ! isCreatingMenu || createNavigationMenuIsSuccess )
			);
		}

		if ( isCreatingMenu && createNavigationMenuIsSuccess ) {
			setIsCreatingMenu( false );
		}
	}, [
		currentMenuId,
		hasNavigationMenus,
		hasResolvedNavigationMenus,
		createNavigationMenuIsSuccess,
		isNavigationMenuResolved,
	] );

	toggleProps = {
		...toggleProps,
		className: 'wp-block-navigation__navigation-selector-button',
		children: (
			<Icon
				icon={ isPressed ? chevronUp : chevronDown }
				className="wp-block-navigation__navigation-selector-button__icon"
			/>
		),
		onClick: () => {
			setIsPressed( ! isPressed );
		},
		disabled: ! enableOptions,
	};

	return (
		<DropdownMenu
			className="wp-block-navigation__navigation-selector"
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
											setSelectorLabel(
												__( 'Loading options …' )
											);
											setEnableOptions( false );
											onSelectClassicMenu( menu );
											onClose();
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

					{ canUserCreateNavigationMenu && (
						<MenuGroup label={ __( 'Tools' ) }>
							<MenuItem
								onClick={ () => {
									onClose();
									onCreateNew();
									setIsCreatingMenu( true );
									setSelectorLabel(
										__( 'Loading options …' )
									);
									setEnableOptions( false );
								} }
							>
								{ __( 'Create new menu' ) }
							</MenuItem>
						</MenuGroup>
					) }
				</>
			) }
		</DropdownMenu>
	);
}

export default NavigationMenuSelector;
