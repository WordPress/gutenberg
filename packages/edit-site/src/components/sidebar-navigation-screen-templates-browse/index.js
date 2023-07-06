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
		description: __(
			'Create new templates, or reset any customizations made to the templates supplied by your theme.'
		),
	},
	wp_template_part: {
		title: __( 'All template parts' ),
		description: __(
			'Create new template parts, or reset any customizations made to the template parts supplied by your theme.'
		),
	},
};

export default function SidebarNavigationScreenTemplatesBrowse() {
	const {
		params: { postType },
	} = useNavigator();
	return (
		<SidebarNavigationScreen
			title={ config[ postType ].title }
			description={ config[ postType ].description }
		/>
	);
}
