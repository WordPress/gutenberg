/**
 * WordPress dependencies
 */
import {
	UnsavedChangesWarning,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Layout from '../layout';
import Page from '../page';
import { unlock } from '../../lock-unlock';

const { RouterProvider } = unlock( routerPrivateApis );
const { GlobalStylesProvider } = unlock( editorPrivateApis );

const defaultRoute = {
	key: 'index',
	areas: {
		sidebar: 'Empty Sidebar',
		content: <Page>Welcome to Posts</Page>,
		preview: undefined,
		mobile: <Page>Welcome to Posts</Page>,
	},
};

export default function PostsApp() {
	return (
		<GlobalStylesProvider>
			<UnsavedChangesWarning />
			<RouterProvider>
				<Layout route={ defaultRoute } />
			</RouterProvider>
		</GlobalStylesProvider>
	);
}
