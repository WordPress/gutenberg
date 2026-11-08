import { __ } from '@wordpress/i18n';
import {
	Notice as WCNotice,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';

function NotFoundError() {
	return (
		<WCNotice status="error" isDismissible={ false }>
			{ __(
				'The requested page could not be found. Please check the URL.'
			) }
		</WCNotice>
	);
}

export const notFoundRoute = {
	name: 'notfound',
	path: '*',
	areas: {
		sidebar: <SidebarNavigationScreenMain />,
		mobileSidebar: (
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
