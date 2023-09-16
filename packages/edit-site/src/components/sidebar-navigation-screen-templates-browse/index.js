/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';

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
		backPath: '/patterns',
	},
};

export default function SidebarNavigationScreenTemplatesBrowse() {
	const {
		params: { postType },
	} = useNavigator();

	const { isTemplatePartsMode, didAccessPatternsPage } = useSelect(
		( select ) => {
			return {
				isTemplatePartsMode:
					!! select( editSiteStore ).getSettings()
						.supportsTemplatePartsMode,
				didAccessPatternsPage: unlock(
					select( editSiteStore )
				).didAccessPatternsPage(),
			};
		},
		[]
	);

	return (
		<SidebarNavigationScreen
			isRoot={ isTemplatePartsMode && ! didAccessPatternsPage }
			title={ config[ postType ].title }
			description={ config[ postType ].description }
			backPath={ config[ postType ].backPath }
		/>
	);
}
