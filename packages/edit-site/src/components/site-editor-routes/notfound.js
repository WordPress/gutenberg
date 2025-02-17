/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';

export const notFoundRoute = {
	name: 'notfound',
	path: '*',
	areas: {
		sidebar: <SidebarNavigationScreenMain />,
		mobile: (
			<SidebarNavigationScreenMain
				customDescription={ __( '404 (Not Found)' ) }
			/>
		),
		content: (
			<p className="edit-site-layout__area__404">
				{ __( '404 (Not Found)' ) }
			</p>
		),
	},
};
