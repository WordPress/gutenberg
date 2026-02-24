/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenNavigationMenus from '../sidebar-navigation-screen-navigation-menus';
import SidebarNavigationScreenUnsupported from '../sidebar-navigation-screen-unsupported';
import { unlock } from '../../lock-unlock';
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

const { useLocation, useHistory } = unlock( routerPrivateApis );

function NavigationAutoSelect() {
	const history = useHistory();
	const { records, hasResolved } = useEntityRecords(
		'postType',
		NAVIGATION_POST_TYPE,
		{ per_page: 1, order: 'desc', orderby: 'date' }
	);

	useEffect( () => {
		if ( hasResolved && records?.length > 0 ) {
			history.navigate( `/wp_navigation/${ records[ 0 ].id }` );
		}
	}, [ hasResolved, records, history ] );

	return null;
}

function MobileNavigationView() {
	const { query = {} } = useLocation();
	const { canvas = 'view' } = query;

	return canvas === 'edit' ? (
		<Editor />
	) : (
		<SidebarNavigationScreenNavigationMenus backPath="/" />
	);
}

export const navigationRoute = {
	name: 'navigation',
	path: '/navigation',
	areas: {
		sidebar( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			return isBlockTheme ? (
				<>
					<NavigationAutoSelect />
					<SidebarNavigationScreenNavigationMenus backPath="/" />
				</>
			) : (
				<SidebarNavigationScreenUnsupported />
			);
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
};
