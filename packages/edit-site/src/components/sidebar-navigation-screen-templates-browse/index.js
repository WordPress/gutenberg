/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';

const config = {
	wp_template: {
		path: '/templates/all',
		title: __( 'All templates' ),
	},
	wp_template_part: {
		path: '/template-parts/all',
		title: __( 'All template parts' ),
	},
};

export default function SidebarNavigationScreenTemplatesBrowse( {
	postType = 'wp_template',
} ) {
	return (
		<SidebarNavigationScreen
			path={ config[ postType ].path }
			title={ config[ postType ].title }
		/>
	);
}
