/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Notice, __experimentalSpacer as Spacer } from '@wordpress/components';
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';

function NotFoundError() {
	return (
		<Notice status="error" isDismissible={ false }>
			{ __(
				'The requested page could not be found. Please check the URL.'
			) }
		</Notice>
	);
}

export const notFoundRoute = {
	name: 'notfound',
	path: '*',
	areas: {
		sidebar: <SidebarNavigationScreenMain />,
		mobile: (
			<SidebarNavigationScreenMain
				customDescription={ <NotFoundError /> }
			/>
		),
		content: (
			<Spacer padding={ 2 }>
				<NotFoundError />
			</Spacer>
		),
	},
};
