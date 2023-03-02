/**
 * WordPress dependencies
 */
import {
	MenuGroup,
	MenuItem,
	MenuItemsChoice,
	DropdownMenu,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';
import useNavigationEntities from '../use-navigation-entities';

function buildMenuLabel( title, id ) {
	const label =
		decodeEntities( title?.rendered ) ||
		/* translators: %s is the index of the menu in the list of menus. */
		sprintf( __( '(no title %s)' ), id );
	return label;
}

function NavigationMenuSelector( {
	currentMenuId,
	onSelectNavigationMenu,
	onSelectClassicMenu,
	onCreateNew,
	actionLabel,
	createNavigationMenuIsSuccess,
	createNavigationMenuIsError,
} ) {
	/* translators: %s: The name of a menu. */
	const createActionLabel = __( "Create from '%s'" );

	const [ isCreatingMenu, setIsCreatingMenu ] = useState( false );

	actionLabel = actionLabel || createActionLabel;

	const { menus: classicMenus } = useNavigationEntities();

	const {
		navigationMenus,
		isResolvingNavigationMenus,
		hasResolvedNavigationMenus,
		canUserCreateNavigationMenu,
		canSwitchNavigationMenu,
	} = useNavigationMenu();

	const [ currentTitle ] = useEntityProp(
		'postType',
		'wp_navigation',
		'title'
	);

	const menuChoices = useMemo( () => {
		return (
			navigationMenus?.map( ( { id, title }, index ) => {
				const label = buildMenuLabel( title, index + 1 );

				return {
					value: id,
					label,
					ariaLabel: sprintf( actionLabel, label ),
				};
			} ) || []
		);
	}, [ navigationMenus, actionLabel ] );

	const hasNavigationMenus = !! navigationMenus?.length;
	const hasClassicMenus = !! classicMenus?.length;
	const showNavigationMenus = !! canSwitchNavigationMenu;
	const showClassicMenus = !! canUserCreateNavigationMenu;

	const noMenuSelected = hasNavigationMenus && ! currentMenuId;
	const noBlockMenus = ! hasNavigationMenus && hasResolvedNavigationMenus;
	const menuUnavailable =
		hasResolvedNavigationMenus && currentMenuId === null;

	let selectorLabel = '';

	if ( isCreatingMenu || isResolvingNavigationMenus ) {
		selectorLabel = __( 'Loading …' );
	} else if ( noMenuSelected || noBlockMenus || menuUnavailable ) {
		// Note: classic Menus may be available.
		selectorLabel = __( 'Choose or create a Navigation menu' );
	} else {
		// Current Menu's title.
		selectorLabel = currentTitle;
	}

	useEffect( () => {
		if (
			isCreatingMenu &&
			( createNavigationMenuIsSuccess || createNavigationMenuIsError )
		) {
			setIsCreatingMenu( false );
		}
	}, [
		isCreatingMenu,
		createNavigationMenuIsError,
		createNavigationMenuIsSuccess,
		setIsCreatingMenu
	] );

	const NavigationMenuSelectorDropdown = (
		<DropdownMenu
			label={ selectorLabel }
			icon={ moreVertical }
			toggleProps={ { isSmall: true } }
		>
			{ ( { onClose } ) => (
				<>
					{ showNavigationMenus && hasNavigationMenus && (
						<MenuGroup label={ __( 'Menus' ) }>
							<MenuItemsChoice
								value={ currentMenuId }
								onSelect={ ( menuId ) => {
									setIsCreatingMenu( true );
									onSelectNavigationMenu( menuId );
									onClose();
								} }
								choices={ menuChoices }
								disabled={ isCreatingMenu }
							/>
						</MenuGroup>
					) }
					{ showClassicMenus && hasClassicMenus && (
						<MenuGroup label={ __( 'Import Classic Menus' ) }>
							{ classicMenus?.map( ( menu ) => {
								const label = decodeEntities( menu.name );
								return (
									<MenuItem
										onClick={ () => {
											setIsCreatingMenu( true );
											onSelectClassicMenu( menu );
											onClose();
										} }
										key={ menu.id }
										aria-label={ sprintf(
											createActionLabel,
											label
										) }
										disabled={ isCreatingMenu }
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
					) }
				</>
			) }
		</DropdownMenu>
	);

	return NavigationMenuSelectorDropdown;
}

export default NavigationMenuSelector;
