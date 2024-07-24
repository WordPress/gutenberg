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
import useInitEditedEntityFromURL from '../sync-state-with-url/use-init-edited-entity-from-url';
import Layout from '../layout';
import useLayoutAreas from './router';
import { unlock } from '../../lock-unlock';

const { RouterProvider } = unlock( routerPrivateApis );
const { GlobalStylesProvider } = unlock( editorPrivateApis );

function PostsLayout() {
	// This ensures the edited entity id and type are initialized properly.
	useInitEditedEntityFromURL();
	const route = useLayoutAreas();
	return <Layout route={ route } />;
}

export default function PostsApp() {
	return (
		<GlobalStylesProvider>
			<UnsavedChangesWarning />
			<RouterProvider>
				<PostsLayout />
			</RouterProvider>
		</GlobalStylesProvider>
	);
}
