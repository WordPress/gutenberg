import { __ } from '@wordpress/i18n';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import DataviewsTemplatesSidebarContent from './content';
import DataviewsTemplatesSidebarContentLegacy from './content-legacy';

export default function SidebarNavigationScreenTemplatesBrowse( { backPath } ) {
	return (
		<SidebarNavigationScreen
			title={ __( 'Templates' ) }
			description={ __(
				'Manage the templates that define the structure of your pages, or reset any customizations made to those supplied by your theme.'
			) }
			backPath={ backPath }
			content={
				window?.__experimentalTemplateActivate ? (
					<DataviewsTemplatesSidebarContent />
				) : (
					<DataviewsTemplatesSidebarContentLegacy />
				)
			}
		/>
	);
}
