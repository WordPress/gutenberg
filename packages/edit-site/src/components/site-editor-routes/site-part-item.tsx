import Editor from '../editor';
import SidebarNavigationScreenSitePart from '../sidebar-navigation-screen-site-part';
import SidebarSitePartPanel from '../sidebar-site-part-panel';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import { isThemeDataLoaded } from './utils';

export const sitePartItemRoute = {
	name: 'site-part-item',
	path: '/site-parts/:area',
	areas: {
		sidebar( { siteData }: { siteData: any } ) {
			if ( ! isThemeDataLoaded( siteData ) ) {
				return null;
			}
			return siteData.currentTheme.is_block_theme ? (
				<SidebarNavigationScreenSitePart />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		// An open panel shows beside the sidebar, with the part still on the
		// canvas.
		content( { query }: { query?: { panel?: string } } ) {
			return query?.panel ? <SidebarSitePartPanel /> : undefined;
		},
		preview: <Editor />,
		mobileSidebar: <SidebarNavigationScreenSitePart />,
		mobileContent( { query }: { query?: { panel?: string } } ) {
			return query?.panel ? <SidebarSitePartPanel /> : undefined;
		},
	},
	widths: {
		content( { query }: { query?: { panel?: string } } ) {
			return query?.panel ? 380 : undefined;
		},
	},
};
