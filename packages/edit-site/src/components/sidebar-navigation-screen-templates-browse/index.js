/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
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
import DataviewsTemplatesSidebarContent from './content';

const config = {
	[ TEMPLATE_POST_TYPE ]: {
		title: __( 'Manage templates' ),
		description: __(
			'Create new templates, or reset any customizations made to the templates supplied by your theme.'
		),
		contentTitle: __( 'All templates' ),
	},
	[ TEMPLATE_PART_POST_TYPE ]: {
		title: __( 'Manage template parts' ),
		description: __(
			'Create new template parts, or reset any customizations made to the template parts supplied by your theme.'
		),
		backPath: { path: '/patterns' },
		contentTitle: __( 'All template parts' ),
	},
};

const { useLocation } = unlock( routerPrivateApis );

export default function SidebarNavigationScreenTemplatesBrowse( { postType } ) {
	const {
		params: { didAccessPatternsPage, activeView = 'all' },
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
			content={
				<DataviewsTemplatesSidebarContent
					activeView={ activeView }
					postType={ postType }
					title={ config[ postType ].contentTitle }
				/>
			}
		/>
	);
}
