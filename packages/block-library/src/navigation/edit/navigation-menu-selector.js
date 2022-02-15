/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';
import { useEffect } from '@wordpress/element';

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
	showManageActions = false,
	actionLabel,
} ) {
	/* translators: %s: The name of a menu. */
	const createActionLabel = __( "Create from '%s'" );

	actionLabel = actionLabel || createActionLabel;

	const { menus: classicMenus } = useNavigationEntities();

	const {
		navigationMenus,
		canUserCreateNavigation: canUserCreateNavigationMenu,
		canUserUpdateNavigationEntity: canUserUpdateNavigationMenu,
		canSwitchNavigationMenu,
	} = useNavigationMenu();

	const createNavigationMenu = useCreateNavigationMenu( clientId );

	// const onFinishMenuCreation = async (
	// 	blocks,
	// 	navigationMenuTitle = null
	// ) => {
	// 	if ( ! canUserCreateNavigationMenu ) {
	// 		return;
	// 	}

	// 	const navigationMenu = await createNavigationMenu(
	// 		navigationMenuTitle,
	// 		blocks
	// 	);
	// 	onSelect( navigationMenu );
	// };

	const {
		dispatch: convertClassicMenuToBlocks,
		blocks: classicMenuBlocks,
		name: classicMenuName,
		isResolving: isResolvingClassicMenuConversion,
		hasResolved: hasResolvedClassicMenuConversion,
	} = useConvertClassicMenu( () => {} );

	useEffect( () => {
		async function handleCreateNav() {
			const navigationMenu = await createNavigationMenu(
				classicMenuName,
				classicMenuBlocks
			);
			onSelect( navigationMenu );
		}
		if (
			hasResolvedClassicMenuConversion &&
			classicMenuName &&
			classicMenuBlocks?.length
		) {
			handleCreateNav();
		}
	}, [
		classicMenuBlocks,
		classicMenuName,
		isResolvingClassicMenuConversion,
		hasResolvedClassicMenuConversion,
	] );

	const hasNavigationMenus = !! navigationMenus?.length;
	const hasClassicMenus = !! classicMenus?.length;
	const showNavigationMenus = !! canSwitchNavigationMenu;
	const showClassicMenus = !! canUserCreateNavigationMenu;
	const hasManagePermissions =
		canUserCreateNavigationMenu || canUserUpdateNavigationMenu;
	const showSelectMenus =
		( canSwitchNavigationMenu || canUserCreateNavigationMenu ) &&
		( hasNavigationMenus || hasClassicMenus );

	if ( ! showSelectMenus ) {
		return null;
	}

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
	);
}
