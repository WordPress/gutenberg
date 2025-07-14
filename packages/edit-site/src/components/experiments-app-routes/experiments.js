/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import ExperimentsPage from '../experiments-page';

export const experimentsRoute = {
	name: 'experiments',
	path: '/',
	areas: {
		sidebar: (
			<SidebarNavigationScreen
				title={ __( 'Experiments' ) }
				isRoot
				content={
					<p>
						{ __(
							"The block editor includes experimental features that are usable while they're in development.Select the ones you'd like to enable. These features are likely to change, so avoid using them in production."
						) }
					</p>
				}
			/>
		),
		content: <ExperimentsPage />,
	},
};
