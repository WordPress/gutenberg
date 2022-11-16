/**
 * WordPress dependencies
 */
import {
	MenuGroup,
	MenuItem,
	MenuItemsChoice,
	DropdownMenu,
	Button,
	VisuallyHidden,
} from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { Icon, chevronUp, chevronDown, moreVertical } from '@wordpress/icons';
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
	createNavigationMenuIsError,
	toggleProps = {},
} ) {
	const isOffCanvasNavigationEditorEnabled =
		window?.__experimentalEnableOffCanvasNavigationEditor === true;

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

	const [ currentTitle ] = useEntityProp(
		'postType',
		'wp_navigation',
		'title'
	);

	const shouldEnableMenuSelector =
		( canSwitchNavigationMenu || canUserCreateNavigationMenu ) &&
		hasResolvedNavigationMenus &&
		! isCreatingMenu;

	const menuChoices = useMemo( () => {
		return (
			navigationMenus?.map( ( { id, title } ) => {
				const label = decodeEntities( title.rendered );
				if ( id === currentMenuId && ! isCreatingMenu ) {
					setSelectorLabel( currentTitle );
					setEnableOptions( shouldEnableMenuSelector );
				}
				return {
					value: id,
					label,
					ariaLabel: sprintf( actionLabel, label ),
				};
			} ) || []
		);
	}, [
		currentTitle,
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
		disabled: ! enableOptions,
		__experimentalIsFocusable: true,
		onClick: () => {
			setIsPressed( ! isPressed );
		},
	};

	if ( ! hasNavigationMenus && ! hasClassicMenus ) {
		return (
			<Button
				className="wp-block-navigation__navigation-selector-button--createnew"
				isBusy={ ! enableOptions }
				disabled={ ! enableOptions }
				__experimentalIsFocusable
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
	}

	return (
		<DropdownMenu
			className={
				isOffCanvasNavigationEditorEnabled
					? ''
					: 'wp-block-navigation__navigation-selector'
			}
			label={ selectorLabel }
			text={
				<span className="wp-block-navigation__navigation-selector-button__label">
					{ isOffCanvasNavigationEditorEnabled ? '' : selectorLabel }
				</span>
			}
			icon={ isOffCanvasNavigationEditorEnabled ? moreVertical : null }
			toggleProps={
				isOffCanvasNavigationEditorEnabled
					? { isSmall: true }
					: toggleProps
			}
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
