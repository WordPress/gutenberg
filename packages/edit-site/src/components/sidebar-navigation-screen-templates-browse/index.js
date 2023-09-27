/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { store as editSiteStore } from '../../store';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
} from '../../utils/constants';
import { unlock } from '../../lock-unlock';

const config = {
	[ TEMPLATE_POST_TYPE ]: {
		title: __( 'All templates' ),
		description: __(
			'Create new templates, or reset any customizations made to the templates supplied by your theme.'
		),
	},
	[ TEMPLATE_PART_POST_TYPE ]: {
		title: __( 'All template parts' ),
		description: __(
			'Create new template parts, or reset any customizations made to the template parts supplied by your theme.'
		),
		backPath: '/patterns',
	},
};

const { useLocation } = unlock( routerPrivateApis );

export default function SidebarNavigationScreenTemplatesBrowse() {
	const {
		params: { postType },
	} = useNavigator();
	const {
		params: { didAccessPatternsPage },
	} = useLocation();

	const isTemplatePartsMode = useSelect( ( select ) => {
		return !! select( editSiteStore ).getSettings()
			.supportsTemplatePartsMode;
	}, [] );

	return (
		<SidebarNavigationScreen
			// If a classic theme that supports template parts has never
			// accessed the Patterns page, return to the dashboard.
			isRoot={ isTemplatePartsMode && ! didAccessPatternsPage }
			title={ config[ postType ].title }
			description={ config[ postType ].description }
			backPath={ config[ postType ].backPath }
		/>
	);
}
