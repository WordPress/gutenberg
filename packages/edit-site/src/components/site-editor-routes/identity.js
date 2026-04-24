/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import { unlock } from '../../lock-unlock';
import SidebarNavigationScreenIdentity from '../sidebar-navigation-screen-identity';
import SidebarIdentity from '../sidebar-identity';

const { useLocation } = unlock( routerPrivateApis );

function MobileIdentityView() {
	const { query = {} } = useLocation();
	const { canvas } = query;

	if ( canvas === 'edit' ) {
		return <Editor />;
	}

	return <SidebarIdentity />;
}

export const identityRoute = {
	name: 'identity',
	path: '/identity',
	areas: {
		sidebar: <SidebarNavigationScreenIdentity />,
		content: <SidebarIdentity />,
		preview: <Editor />,
		mobile: <MobileIdentityView />,
	},
	widths: {
		content: 380,
	},
};
