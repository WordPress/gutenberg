/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import DataViewsSidebarContent from '../sidebar-dataviews';
import NavigationMenuList from '../navigation-menu-list';
import { unlock } from '../../lock-unlock';
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

const { useLocation } = unlock( routerPrivateApis );

function MobileNavigationView() {
	const { query = {} } = useLocation();
	const { canvas = 'view' } = query;

	return canvas === 'edit' ? <Editor /> : <NavigationMenuList />;
}

export const navigationRoute = {
	name: 'navigation',
	path: '/navigation',
	areas: {
		sidebar( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<SidebarNavigationScreen
					title={ __( 'Navigation' ) }
					backPath="/"
					content={
						<DataViewsSidebarContent
							postType={ NAVIGATION_POST_TYPE }
						/>
					}
				/>
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
		content( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? <NavigationMenuList /> : undefined;
		},
		preview( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? <Editor /> : undefined;
		},
		mobile( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<MobileNavigationView />
			) : (
				<SidebarNavigationScreenUnsupported />
			);
		},
	},
	widths: {
		content: () => 380,
	},
};
