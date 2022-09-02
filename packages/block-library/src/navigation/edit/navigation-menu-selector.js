/**
 * WordPress dependencies
 */
import {
	MenuGroup,
	MenuItem,
	MenuItemsChoice,
<<<<<<< HEAD
	DropdownMenu,
	Button,
	VisuallyHidden,
=======
	ToolbarDropdownMenu,
>>>>>>> c9c4d2f402 (Remove prevent duplicated classic menus for another PR)
} from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { Icon, chevronUp, chevronDown } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
<<<<<<< HEAD
import { useEffect, useMemo, useState } from '@wordpress/element';
=======
import { addQueryArgs } from '@wordpress/url';
import { forwardRef, useMemo } from '@wordpress/element';
>>>>>>> c9c4d2f402 (Remove prevent duplicated classic menus for another PR)

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';
import useNavigationEntities from '../use-navigation-entities';

<<<<<<< HEAD
function NavigationMenuSelector( {
	currentMenuId,
	onSelectNavigationMenu,
	onSelectClassicMenu,
	onCreateNew,
	actionLabel,
	createNavigationMenuIsSuccess,
	createNavigationMenuIsError,
	toggleProps = {},
} ) {
=======
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
>>>>>>> c9c4d2f402 (Remove prevent duplicated classic menus for another PR)
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

<<<<<<< HEAD
	const [ currentTitle ] = useEntityProp(
		'postType',
		'wp_navigation',
		'title'
	);

	const shouldEnableMenuSelector =
		( canSwitchNavigationMenu || canUserCreateNavigationMenu ) &&
		hasResolvedNavigationMenus &&
		! isCreatingMenu;

=======
>>>>>>> c9c4d2f402 (Remove prevent duplicated classic menus for another PR)
	const menuChoices = useMemo( () => {
		return (
			navigationMenus?.map( ( { id, title } ) => {
				const label = decodeEntities( title.rendered );
<<<<<<< HEAD
				if ( id === currentMenuId && ! isCreatingMenu ) {
					setSelectorLabel( currentTitle );
					setEnableOptions( shouldEnableMenuSelector );
				}
=======
>>>>>>> c9c4d2f402 (Remove prevent duplicated classic menus for another PR)
				return {
					value: id,
					label,
					ariaLabel: sprintf( actionLabel, label ),
				};
			} ) || []
		);
<<<<<<< HEAD
	}, [
		currentTitle,
		currentMenuId,
		navigationMenus,
		createNavigationMenuIsSuccess,
		isNavigationMenuResolved,
		hasResolvedNavigationMenus,
	] );

=======
	}, [ navigationMenus ] );
>>>>>>> c9c4d2f402 (Remove prevent duplicated classic menus for another PR)
	const hasNavigationMenus = !! navigationMenus?.length;
	const hasClassicMenus = !! classicMenus?.length;
	const showNavigationMenus = !! canSwitchNavigationMenu;
	const showClassicMenus = !! canUserCreateNavigationMenu;
<<<<<<< HEAD

	const noMenuSelected = hasNavigationMenus && ! currentMenuId;
	const noBlockMenus = ! hasNavigationMenus && hasResolvedNavigationMenus;
	const menuUnavailable =
		hasResolvedNavigationMenus && currentMenuId === null;

	useEffect( () => {
		if ( ! hasResolvedNavigationMenus ) {
			setSelectorLabel( __( 'Loading …' ) );
		} else if ( noMenuSelected || noBlockMenus || menuUnavailable ) {
			setSelectorLabel( __( 'Select menu' ) );
			setEnableOptions( shouldEnableMenuSelector );
		}

		if (
			isCreatingMenu &&
			( createNavigationMenuIsSuccess || createNavigationMenuIsError )
		) {
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
			<>
				<VisuallyHidden as="span">
					{ __( 'Select Menu' ) }
				</VisuallyHidden>
				<Icon
					icon={ isPressed ? chevronUp : chevronDown }
					className="wp-block-navigation__navigation-selector-button__icon"
				/>
			</>
		),
		isBusy: ! enableOptions,
		onClick: () => {
			setIsPressed( ! isPressed );
		},
	};

	if ( ! hasNavigationMenus && ! hasClassicMenus ) {
		return (
			<Button
				{ ...toggleProps }
				className="wp-block-navigation__navigation-selector-button--createnew"
				disabled={ ! enableOptions }
				onClick={ () => {
					onCreateNew();
					setIsCreatingMenu( true );
					setSelectorLabel( __( 'Loading …' ) );
					setEnableOptions( false );
				} }
			>
				{ __( 'Create new menu' ) }
			</Button>
		);
=======
	const hasManagePermissions =
		canUserCreateNavigationMenu || canUserUpdateNavigationMenu;

	// Show the selector if:
	// - has switch or create permissions and there are block or classic menus not previously imported.
	// - user has create or update permissions and component should show the menu actions.
	const showSelectMenus =
		( ( canSwitchNavigationMenu || canUserCreateNavigationMenu ) &&
			( hasNavigationMenus || hasClassicMenus ) ) ||
		( hasManagePermissions && showManageActions );

	if ( ! showSelectMenus ) {
		return null;
>>>>>>> c9c4d2f402 (Remove prevent duplicated classic menus for another PR)
	}

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
<<<<<<< HEAD
=======
									onClose();
>>>>>>> c9c4d2f402 (Remove prevent duplicated classic menus for another PR)
									onSelectNavigationMenu( menuId );
								} }
								choices={ menuChoices }
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
											setSelectorLabel(
												__( 'Loading …' )
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
									setSelectorLabel( __( 'Loading …' ) );
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
