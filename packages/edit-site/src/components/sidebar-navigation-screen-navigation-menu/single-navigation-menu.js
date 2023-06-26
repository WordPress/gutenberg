/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
/**
 * Internal dependencies
 */
import { SidebarNavigationScreenWrapper } from '../sidebar-navigation-screen-navigation-menus';
import ScreenNavigationMoreMenu from './more-menu';
import NavigationMenuEditor from './navigation-menu-editor';

export default function SingleNavigationMenu( {
	navigationMenu,
	handleDelete,
	handleDuplicate,
	handleSave,
} ) {
	const menuTitle = navigationMenu?.title?.rendered;

	return (
		<SidebarNavigationScreenWrapper
			actions={
				<ScreenNavigationMoreMenu
					menuTitle={ decodeEntities( menuTitle ) }
					onDelete={ handleDelete }
					onSave={ handleSave }
					onDuplicate={ handleDuplicate }
				/>
			}
			title={ decodeEntities( menuTitle ) }
			description={ __(
				'Navigation menus are a curated collection of blocks that allow visitors to get around your site.'
			) }
		>
			<NavigationMenuEditor navigationMenuId={ navigationMenu?.id } />
		</SidebarNavigationScreenWrapper>
	);
}
