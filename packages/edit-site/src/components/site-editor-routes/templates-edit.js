/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import PageTemplates from '../page-templates';
import Editor from '../editor';
import SidebarNavigationScreenTemplatesBrowse from '../sidebar-navigation-screen-templates-browse';

export const templatesEditRoute = {
	name: 'templates-edit',
	match: ( params ) => {
		return (
			params.postType === TEMPLATE_POST_TYPE && params.canvas === 'edit'
		);
	},
	areas: {
		sidebar: <SidebarNavigationScreenTemplatesBrowse backPath={ {} } />,
		content: <PageTemplates />,
		mobile: <Editor />,
		preview: <Editor />,
	},
};
