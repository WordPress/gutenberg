/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';

export default function SidebarNavigationScreenPagesList() {
	return (
		<SidebarNavigationScreen
			title={ __( 'All Pages' ) }
			description={ __( 'Manage your pages description' ) }
			backPath="/page"
		/>
	);
}
