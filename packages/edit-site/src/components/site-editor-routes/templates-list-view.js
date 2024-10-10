/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import PageTemplates from '../page-templates';
import Editor from '../editor';
import SidebarNavigationScreenTemplatesBrowse from '../sidebar-navigation-screen-templates-browse';

export const templatesListViewRoute = {
	name: 'templates-list-view',
	match: ( params ) => {
		return (
			params.isCustom !== 'true' &&
			params.layout === 'list' &&
			params.postType === TEMPLATE_POST_TYPE &&
			params.canvas !== 'edit'
		);
	},
	areas: {
		sidebar: <SidebarNavigationScreenTemplatesBrowse backPath={ {} } />,
		content: <PageTemplates />,
		mobile: <PageTemplates />,
		preview: <Editor />,
	},
	widths: {
		content: 380,
	},
};
