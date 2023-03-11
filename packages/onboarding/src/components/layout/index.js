/**
 * WordPress dependencies
 */
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	Flex,
	FlexItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import { Main, SiteDetails, AddPages } from '../navigation-screens';

export default function Layout() {
	return (
		<NavigatorProvider
			className="edit-site-sidebar__content"
			initialPath="/"
		>
			<div className="onboarding-layout">
				<Flex className="onboarding-layout__content">
					<FlexItem>
						<Sidebar />
					</FlexItem>
					<FlexItem isBlock>
						<NavigatorScreen path="/">
							<Main />
						</NavigatorScreen>
						<NavigatorScreen path="/site-details">
							<SiteDetails />
						</NavigatorScreen>
						<NavigatorScreen path="/add-pages">
							<AddPages />
						</NavigatorScreen>
					</FlexItem>
				</Flex>
			</div>
		</NavigatorProvider>
	);
}
