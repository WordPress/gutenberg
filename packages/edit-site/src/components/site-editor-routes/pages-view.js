/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostList from '../post-list';
import DataViewsSidebarContent from '../sidebar-dataviews';
import SidebarNavigationScreen from '../sidebar-navigation-screen';

function PageList() {
	return <PostList postType="page" />;
}

export const pagesViewRoute = {
	name: 'pages-view',
	match: ( params ) => {
		return (
			( params.isCustom === 'true' ||
				( params.layout ?? 'list' ) !== 'list' ) &&
			! params.quickEdit &&
			params.postType === 'page' &&
			params.canvas !== 'edit'
		);
	},
	areas: {
		sidebar: (
			<SidebarNavigationScreen
				title={ __( 'Pages' ) }
				backPath={ {} }
				content={ <DataViewsSidebarContent /> }
			/>
		),
		content: <PageList />,
		mobile: <PageList />,
	},
};
