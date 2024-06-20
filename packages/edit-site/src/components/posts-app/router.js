/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { useIsSiteEditorLoading } from '../layout/hooks';
import Editor from '../editor';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';
import DataViewsSidebarContent from '../sidebar-dataviews';
import PostsList from '../posts-app/posts-list';

const { useLocation } = unlock( routerPrivateApis );

export default function useLayoutAreas() {
	const isSiteEditorLoading = useIsSiteEditorLoading();
	const { params = {} } = useLocation();
	const { postType, layout, canvas } = params;
	const labels = useSelect(
		( select ) => {
			return select( coreStore ).getPostType( postType )?.labels;
		},
		[ postType ]
	);

	// Posts list.
	if ( [ 'page', 'post' ].includes( postType ) ) {
		const isListLayout = layout === 'list' || ! layout;
		return {
			key: 'pages',
			areas: {
				sidebar: (
					<SidebarNavigationScreen
						title={ labels?.name }
						backPath={ {} }
						content={ <DataViewsSidebarContent /> }
					/>
				),
				content: <PostsList postType={ postType } />,
				preview: ( isListLayout || canvas === 'edit' ) && (
					<Editor isLoading={ isSiteEditorLoading } />
				),
				mobile:
					canvas === 'edit' ? (
						<Editor isLoading={ isSiteEditorLoading } />
					) : (
						<PostsList postType={ postType } />
					),
			},
			widths: {
				content: isListLayout ? 380 : undefined,
			},
		};
	}

	// const defaultRoute = {
	// 	key: 'index',
	// 	areas: {
	// 		sidebar: 'Empty Sidebar',
	// 		content: <PostsList />,
	// 		preview: undefined,
	// 		mobile: <Page>Welcome to Posts</Page>,
	// 	},
	// };
	// Fallback shows the home page preview
	return {
		key: 'default',
		areas: {
			sidebar: <SidebarNavigationScreenMain />,
			preview: <Editor isLoading={ isSiteEditorLoading } />,
			mobile: canvas === 'edit' && (
				<Editor isLoading={ isSiteEditorLoading } />
			),
		},
	};
}
