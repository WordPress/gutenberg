import { __ } from '@wordpress/i18n';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { MainSidebarNavigationContent } from '../sidebar-navigation-screen-main';

export default function SidebarNavigationScreenGlobalStyles() {
	return (
		<SidebarNavigationScreen
			title={ __( 'Design' ) }
			isRoot
			description={ __(
				'Customize the appearance of your website using the block editor.'
			) }
			content={ <MainSidebarNavigationContent /> }
		/>
	);
}
