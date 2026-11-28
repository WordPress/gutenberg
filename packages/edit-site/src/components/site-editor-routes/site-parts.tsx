import Editor from '../editor';
import SidebarNavigationScreenSiteParts from '../sidebar-navigation-screen-site-parts';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import { isThemeDataLoaded } from './utils';

export const sitePartsRoute = {
	name: 'site-parts',
	path: '/site-parts',
	areas: {
		sidebar( { siteData }: { siteData: any } ) {
			if ( ! isThemeDataLoaded( siteData ) ) {
				return null;
			}
			return siteData.currentTheme.is_block_theme ? (
				<SidebarNavigationScreenSiteParts />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		// Show the homepage, where the site parts listed appear.
		preview: <Editor renderingMode="template-locked" />,
		mobileSidebar: <SidebarNavigationScreenSiteParts />,
	},
};
