/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';
import useNavigationEntities from '../use-navigation-entities';
import useConvertClassicMenu from '../use-convert-classic-menu';
import useCreateNavigationMenu from './use-create-navigation-menu';
import ExistingMenusOptions from './existing-menus-options';

export default function NavigationMenuSelector( {
	clientId,
	onSelect,
	onCreateNew,
} ) {
	const {
		menus: classicMenus,
		hasMenus: hasClassicMenus,
	} = useNavigationEntities();

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

	const showSelectMenus =
		( canSwitchNavigationMenu || canUserCreateNavigation ) &&
		( navigationMenus?.length || hasClassicMenus );

	if ( ! showSelectMenus ) {
		return null;
	}

	return (
		<>
			<ExistingMenusOptions
				showNavigationMenus={ canSwitchNavigationMenu }
				showClassicMenus={ canUserCreateNavigation }
				navigationMenus={ navigationMenus }
				classicMenus={ classicMenus }
				onSelectNavigationMenu={ onSelect }
				onSelectClassicMenu={ ( { id, name } ) =>
					convertClassicMenuToBlocks( id, name )
				}
				/* translators: %s: The name of a menu. */
				actionLabel={ __( "Switch to '%s'" ) }
			/>

			{ canUserCreateNavigation && (
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
