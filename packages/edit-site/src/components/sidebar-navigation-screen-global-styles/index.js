/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import StyleVariationsContainer from '../global-styles/style-variations-container';

export default function SidebarNavigationScreenGlobalStyles() {
	return (
		<SidebarNavigationScreen
			title={ __( 'Styles' ) }
			description={ __(
				'Choose a different style combination for the theme styles.'
			) }
			content={ <StyleVariationsContainer /> }
		/>
	);
}
