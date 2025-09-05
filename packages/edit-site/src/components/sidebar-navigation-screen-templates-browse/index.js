/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import DataviewsTemplatesSidebarContent from './content';

export default function SidebarNavigationScreenTemplatesBrowse( { backPath } ) {
	return (
		<SidebarNavigationScreen
			title={ __( 'Templates' ) }
			description={ __(
				'Create new templates, or reset any customizations made to the templates supplied by your theme.'
			) }
			backPath={ backPath }
			content={ <DataviewsTemplatesSidebarContent /> }
		/>
	);
}
