/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import NavigationInspector from '../sidebar-edit-mode/navigation-menu-sidebar/navigation-inspector';

export default function SidebarNavigationScreenNavigationMenus() {
	return (
		<SidebarNavigationScreen
			path="/navigation"
			parentTitle={ __( 'Design' ) }
			title={ __( 'Navigation' ) }
			content={
				<div className="edit-site-sidebar-navigation-screen-navigation-menus">
					<NavigationInspector />
				</div>
			}
		/>
	);
}
