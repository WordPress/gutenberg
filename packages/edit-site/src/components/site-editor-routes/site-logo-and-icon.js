/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import { unlock } from '../../lock-unlock';
import SidebarNavigationScreenSiteLogoAndIcon from '../sidebar-navigation-screen-site-logo-and-icon';
import SidebarSiteLogoAndIcon from '../sidebar-site-logo-and-icon';

const { useLocation } = unlock( routerPrivateApis );

function MobileSiteLogoAndIconView() {
	const { query = {} } = useLocation();
	const { canvas } = query;

	if ( canvas === 'edit' ) {
		return <Editor />;
	}

	return <SidebarSiteLogoAndIcon />;
}

export const siteLogoAndIconRoute = {
	name: 'site-logo-and-icon',
	path: '/site-logo-and-icon',
	areas: {
		sidebar: <SidebarNavigationScreenSiteLogoAndIcon />,
		content: <SidebarSiteLogoAndIcon />,
		preview: <Editor />,
		mobile: <MobileSiteLogoAndIconView />,
	},
	widths: {
		content: 380,
	},
};
