/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenNavigationMenuDetail from '../sidebar-navigation-screen-navigation-menu-detail';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import NavigationMenuDetail from '../navigation-menu-detail';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

function MobileNavigationItemView() {
	const { query = {}, params = {} } = useLocation();
	const { canvas = 'view' } = query;
	const { postId } = params;

	return canvas === 'edit' ? (
		<Editor />
	) : (
		<>
			<SidebarNavigationScreenNavigationMenuDetail
				postId={ postId }
				backPath="/navigation"
			/>
			<NavigationMenuDetail menuId={ postId } />
		</>
	);
}

export const navigationItemRoute = {
	name: 'navigation-item',
	path: '/navigation/:postId',
	areas: {
		sidebar( { siteData, params } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<SidebarNavigationScreenNavigationMenuDetail
					postId={ params?.postId }
					backPath="/navigation"
				/>
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		content( { siteData, params } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<NavigationMenuDetail menuId={ params?.postId } />
			) : undefined;
		},
		preview( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<Editor />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		mobile( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<MobileNavigationItemView />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
	},
	widths: {
		content: () => 380,
	},
};
