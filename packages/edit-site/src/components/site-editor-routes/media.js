/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import MediaList from '../media-list';
import MediaSidebarContent from '../media-list/sidebar-content';
import MediaInspector from '../media-list/inspector';
import { unlock } from '../../lock-unlock';
import { isThemeDataLoaded } from './utils';

const { useLocation } = unlock( routerPrivateApis );

function MobileMediaView() {
	const { query } = useLocation();
	const { postId } = query;
	return postId ? <MediaInspector /> : <MediaList />;
}

export const mediaRoute = {
	name: 'media',
	path: '/media',
	areas: {
		sidebar( { siteData } ) {
			if ( ! isThemeDataLoaded( siteData ) ) {
				return null;
			}
			return (
				<SidebarNavigationScreen
					title={ __( 'Media' ) }
					backPath="/"
					content={ <MediaSidebarContent /> }
				/>
			);
		},
		content() {
			return <MediaList />;
		},
		async preview( { query: q } ) {
			if ( q.postId ) {
				return <MediaInspector />;
			}
			return undefined;
		},
		mobile( { siteData } ) {
			if ( ! isThemeDataLoaded( siteData ) ) {
				return <></>;
			}
			return <MobileMediaView />;
		},
	},
};
