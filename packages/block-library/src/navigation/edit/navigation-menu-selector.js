/**
 * WordPress dependencies
 */
import {
	MenuGroup,
	MenuItem,
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

	// Avoid showing any currently active menu in the list of
	// menus that can be selected.
	const navigationMenusOmitCurrent =
		navigationMenus?.filter(
			( menu ) => ! currentMenuId || menu.id !== currentMenuId
		) || [];

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

	const hasNavigationMenus = !! navigationMenusOmitCurrent?.length;
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
							{ navigationMenusOmitCurrent?.map( ( menu ) => {
								const label = decodeEntities(
									menu.title.rendered
								);
								return (
									<MenuItem
										onClick={ () => {
											onClose();
											onSelect( menu );
										} }
										key={ menu.id }
										aria-label={ sprintf(
											actionLabel,
											label
										) }
									>
										{ label }
									</MenuItem>
								);
							} ) }
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
