/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';

const config = {
	wp_template: {
		title: __( 'All templates' ),
	},
	wp_template_part: {
		title: __( 'All template parts' ),
	},
};

export default function SidebarNavigationScreenTemplatesBrowse() {
	const {
		params: { postType },
	} = useNavigator();
	return <SidebarNavigationScreen title={ config[ postType ].title } />;
}
