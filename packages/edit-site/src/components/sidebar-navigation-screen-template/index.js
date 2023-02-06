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
		path: '/templates/single',
		parentTitle: __( 'Templates' ),
		title: __( 'Template' ),
	},
	wp_template_part: {
		path: '/template-parts/single',
		parentTitle: __( 'Template parts' ),
		title: __( 'Template part' ),
	},
};

export default function SidebarNavigationScreenTemplate( {
	postType = 'wp_template',
	postId,
} ) {
	return (
		<SidebarNavigationScreen
			path={ config[ postType ].path }
			parentTitle={ config[ postType ].parentTitle }
			title={ config[ postType ].title }
		/>
	);
}
