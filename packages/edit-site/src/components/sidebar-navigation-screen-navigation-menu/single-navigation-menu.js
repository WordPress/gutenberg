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
import buildNavigationLabel from '../sidebar-navigation-screen-navigation-menus/build-navigation-label';
import EditButton from './edit-button';

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
				<>
					<EditButton postId={ navigationMenu?.id } />
					<ScreenNavigationMoreMenu
						menuTitle={ decodeEntities( menuTitle ) }
						onDelete={ handleDelete }
						onSave={ handleSave }
						onDuplicate={ handleDuplicate }
					/>
				</>
			}
			title={ buildNavigationLabel(
				navigationMenu?.title,
				navigationMenu?.id,
				navigationMenu?.status
			) }
			description={ __(
				'Navigation menus are a curated collection of blocks that allow visitors to get around your site.'
			) }
		>
			<NavigationMenuEditor navigationMenuId={ navigationMenu?.id } />
		</SidebarNavigationScreenWrapper>
	);
}
