/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import SidebarNavigationScreenGuidelines from '../sidebar-navigation-screen-guidelines';
import PageGuidelines from '../page-guidelines';

const { useLocation } = unlock( routerPrivateApis );

function MobileGuidelinesUI() {
	const { query = {} } = useLocation();
	const { section } = query;

	// If a section is selected, show the page content, otherwise show the nav
	return section ? (
		<PageGuidelines />
	) : (
		<SidebarNavigationScreenGuidelines backPath="/" />
	);
}

export const guidelinesRoute = {
	name: 'guidelines',
	path: '/guidelines',
	areas: {
		sidebar: <SidebarNavigationScreenGuidelines backPath="/" />,
		content: <PageGuidelines />,
		mobile: <MobileGuidelinesUI />,
	},
};
