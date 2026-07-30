/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { MainSidebarNavigationContent } from '../sidebar-navigation-screen-main';

export default function SidebarNavigationScreenIdentity() {
	return (
		<SidebarNavigationScreen
			isRoot
			title={ __( 'Design' ) }
			description={ __(
				'Customize the appearance of your website using the block editor.'
			) }
			content={ <MainSidebarNavigationContent /> }
		/>
	);
}
