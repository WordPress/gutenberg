/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Layout from '../layout';
import { useRegisterPostsAppRoutes } from '../posts-app-routes';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

const { RouterProvider } = unlock( routerPrivateApis );

export default function PostsApp() {
	useRegisterPostsAppRoutes();
	const routes = useSelect( ( select ) => {
		return unlock( select( editSiteStore ) ).getRoutes();
	}, [] );
	return (
		<RouterProvider routes={ routes } pathArg="p">
			<Layout />
		</RouterProvider>
	);
}
