/**
 * WordPress dependencies
 */
import {
	MenuGroup,
	MenuItem,
	MenuItemsChoice,
	ToolbarDropdownMenu,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';
import useNavigationEntities from '../use-navigation-entities';
import useConvertClassicMenu from '../use-convert-classic-menu';
import useCreateNavigationMenu from './use-create-navigation-menu';

export default function NavigationMenuSelector( {
	currentMenuId,
	clientId,
	onSelect,
	onCreateNew,
	showManageActions = false,
	actionLabel,
	toggleProps = {},
} ) {
	/* translators: %s: The name of a menu. */
	const createActionLabel = __( "Create from '%s'" );

	actionLabel = actionLabel || createActionLabel;

	const { menus: classicMenus } = useNavigationEntities();

	const {
		navigationMenus,
		canUserCreateNavigationMenu,
		canUserUpdateNavigationMenu,
		canSwitchNavigationMenu,
	} = useNavigationMenu();

	const createNavigationMenu = useCreateNavigationMenu( clientId );

	const onFinishMenuCreation = async (
		blocks,
		navigationMenuTitle = null
	) => {
		if ( ! canUserCreateNavigationMenu ) {
			return;
		}

		const navigationMenu = await createNavigationMenu(
			navigationMenuTitle,
			blocks
		);
		onSelect( navigationMenu );
	};

	const convertClassicMenuToBlocks = useConvertClassicMenu(
		onFinishMenuCreation
	);

	const hasNavigationMenus = !! navigationMenus?.length;
	const hasClassicMenus = !! classicMenus?.length;
	const showNavigationMenus = !! canSwitchNavigationMenu;
	const showClassicMenus = !! canUserCreateNavigationMenu;
	const hasManagePermissions =
		canUserCreateNavigationMenu || canUserUpdateNavigationMenu;

	// Show the selector if:
	// - has switch or create permissions and there are block or classic menus.
	// - user has create or update permisisons and component should show the menu actions.
	const showSelectMenus =
		( ( canSwitchNavigationMenu || canUserCreateNavigationMenu ) &&
			( hasNavigationMenus || hasClassicMenus ) ) ||
		( hasManagePermissions && showManageActions );

	if ( ! showSelectMenus ) {
		return null;
	}

	return (
		<ToolbarDropdownMenu
			label={ __( 'Select Menu' ) }
			text={ __( 'Select Menu' ) }
			icon={ null }
			toggleProps={ toggleProps }
		>
			{ ( { onClose } ) => (
				<>
					{ showNavigationMenus && hasNavigationMenus && (
						<MenuGroup label={ __( 'Menus' ) }>
							<MenuItemsChoice
								value={ currentMenuId }
								onSelect={ ( selectedId ) => {
									onClose();
									onSelect(
										navigationMenus.find(
											( post ) => post.id === selectedId
										)
									);
								} }
								choices={ navigationMenus.map(
									( { id, title } ) => {
										const label = decodeEntities(
											title.rendered
										);
										return {
											value: id,
											label,
											ariaLabel: sprintf(
												actionLabel,
												label
											),
										};
									}
								) }
							/>
						</MenuGroup>
					) }
					{ showClassicMenus && hasClassicMenus && (
						<MenuGroup label={ __( 'Classic Menus' ) }>
							{ classicMenus.map( ( menu ) => {
								const label = decodeEntities( menu.name );
								return (
									<MenuItem
										onClick={ () => {
											onClose();
											convertClassicMenuToBlocks(
												menu.id,
												menu.name
											);
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
							<MenuItem
								href={ addQueryArgs( 'edit.php', {
									post_type: 'wp_navigation',
								} ) }
							>
								{ __( 'Manage menus' ) }
							</MenuItem>
						</MenuGroup>
					) }
				</>
			) }
		</ToolbarDropdownMenu>
	);
}
