/**
 * Internal dependencies
 */
import { NAVIGATION_POST_TYPE } from '../../utils/constants';
import Editor from '../editor';
import SidebarNavigationScreenNavigationMenu from '../sidebar-navigation-screen-navigation-menu';

export const navigationItemEditRoute = {
	name: 'navigation-item-edit',
	match: ( params ) => {
		return (
			params.postType === NAVIGATION_POST_TYPE &&
			!! params.postId &&
			params.canvas === 'edit'
		);
	},
	areas: {
		sidebar: (
			<SidebarNavigationScreenNavigationMenu
				backPath={ { postType: NAVIGATION_POST_TYPE } }
			/>
		),
		preview: <Editor />,
		mobile: <Editor />,
	},
};
