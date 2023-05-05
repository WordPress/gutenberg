/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import Themes from '../themes';

export default function SidebarNavigationScreenThemes() {
	return (
		<SidebarNavigationScreen
			title={ __( 'Themes' ) }
			description={ __( 'Choose a theme to preview.' ) }
			content={ <Themes /> }
		/>
	);
}
