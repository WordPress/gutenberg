/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Layout from '../layout';
import { useRegisterExperimentsAppRoutes } from '../experiments-app-routes';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import { ExperimentsProvider } from '../experiments-context';

const { RouterProvider } = unlock( routerPrivateApis );

export default function ExperimentsApp( { experiments } ) {
	useRegisterExperimentsAppRoutes();
	const routes = useSelect( ( select ) => {
		return unlock( select( editSiteStore ) ).getRoutes();
	}, [] );
	return (
		<ExperimentsProvider value={ experiments }>
			<RouterProvider routes={ routes }>
				<Layout />
			</RouterProvider>
		</ExperimentsProvider>
	);
}
