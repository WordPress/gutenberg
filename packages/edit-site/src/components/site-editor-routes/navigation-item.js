/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenNavigationMenu from '../sidebar-navigation-screen-navigation-menu';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

function MobileNavigationItemView() {
	const { query = {} } = useLocation();
	const { canvas = 'view' } = query;

	return canvas === 'edit' ? (
		<Editor />
	) : (
		<SidebarNavigationScreenNavigationMenu backPath="/navigation" />
	);
}

export const navigationItemRoute = {
	name: 'navigation-item',
	path: '/wp_navigation/:postId',
	areas: {
		sidebar: (
			<SidebarNavigationScreenNavigationMenu backPath="/navigation" />
		),
		preview: <Editor />,
		mobile: <MobileNavigationItemView />,
	},
};
