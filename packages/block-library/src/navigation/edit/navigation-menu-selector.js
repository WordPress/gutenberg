/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem } from '@wordpress/components';
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
	clientId,
	onSelect,
	onCreateNew,
	showTools = false,
} ) {
	const { menus: classicMenus } = useNavigationEntities();

	const {
		navigationMenus,
		canUserCreateNavigation,
		canSwitchNavigationMenu,
	} = useNavigationMenu();

	const createNavigationMenu = useCreateNavigationMenu( clientId );

	const onFinishMenuCreation = async (
		blocks,
		navigationMenuTitle = null
	) => {
		if ( ! canUserCreateNavigation ) {
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
	const showClassicMenus = !! canUserCreateNavigation;
	const showSelectMenus =
		( canSwitchNavigationMenu || canUserCreateNavigation ) &&
		( hasNavigationMenus || hasClassicMenus );

	if ( ! showSelectMenus ) {
		return null;
	}

	/* translators: %s: The name of a menu. */
	const actionLabel = __( "Create from '%s'" );

	return (
		<>
			{ showNavigationMenus && hasNavigationMenus && (
				<MenuGroup label={ __( 'Menus' ) }>
					{ navigationMenus.map( ( menu ) => {
						const label = decodeEntities( menu.title.rendered );
						return (
							<MenuItem
								onClick={ () => {
									onSelect( menu );
								} }
								key={ menu.id }
								aria-label={ sprintf( actionLabel, label ) }
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
									convertClassicMenuToBlocks(
										menu.id,
										menu.name
									);
								} }
								key={ menu.id }
								aria-label={ sprintf( actionLabel, label ) }
							>
								{ label }
							</MenuItem>
						);
					} ) }
				</MenuGroup>
			) }

			{ showTools && canUserCreateNavigation && (
				<MenuGroup label={ __( 'Tools' ) }>
					<MenuItem onClick={ onCreateNew }>
						{ __( 'Create new menu' ) }
					</MenuItem>
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
	);
}
