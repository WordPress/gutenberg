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

export default function SingleNavigationMenu( {
	navigationMenu,
	backPath,
	handleDelete,
	handleDuplicate,
	handleSave,
} ) {
	const menuTitle = navigationMenu?.title?.rendered;

	return (
		<SidebarNavigationScreenWrapper
			actions={
				<>
					<ScreenNavigationMoreMenu
						menuId={ navigationMenu?.id }
						menuTitle={ decodeEntities( menuTitle ) }
						onDelete={ handleDelete }
						onSave={ handleSave }
						onDuplicate={ handleDuplicate }
					/>
				</>
			}
			backPath={ backPath }
			title={ buildNavigationLabel(
				navigationMenu?.title,
				navigationMenu?.id,
				navigationMenu?.status
			) }
			description={ __( 'Edit this navigation.' ) }
		>
			<NavigationMenuEditor navigationMenuId={ navigationMenu?.id } />
		</SidebarNavigationScreenWrapper>
	);
}
