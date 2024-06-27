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
import Editor from '../editor';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';
import DataViewsSidebarContent from '../sidebar-dataviews';
import PostsList from '../posts-app/posts-list';

const { useLocation } = unlock( routerPrivateApis );

export default function useLayoutAreas() {
	const { params = {} } = useLocation();
	const { postType, layout, canvas } = params;
	const labels = useSelect(
		( select ) => {
			return select( coreStore ).getPostType( postType )?.labels;
		},
		[ postType ]
	);

	// Posts list.
	if ( [ 'post' ].includes( postType ) ) {
		const isListLayout = layout === 'list' || ! layout;
		return {
			key: 'posts-list',
			areas: {
				sidebar: (
					<SidebarNavigationScreen
						title={ labels?.name }
						// backPath={ {} }
						content={ <DataViewsSidebarContent /> }
					/>
				),
				content: <PostsList postType={ postType } />,
				preview: ( isListLayout || canvas === 'edit' ) && <Editor />,
				mobile:
					canvas === 'edit' ? (
						<Editor />
					) : (
						<PostsList postType={ postType } />
					),
			},
			widths: {
				content: isListLayout ? 380 : undefined,
			},
		};
	}

	// Fallback shows the home page preview
	return {
		key: 'default',
		areas: {
			sidebar: <SidebarNavigationScreenMain />,
			preview: <Editor />,
			mobile: canvas === 'edit' && <Editor />,
		},
	};
}
