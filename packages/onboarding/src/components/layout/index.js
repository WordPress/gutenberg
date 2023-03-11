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
		<NavigatorProvider className="onboarding-layout" initialPath="/">
			<Flex justify="flex-start" align="stretch">
				<FlexItem className="onboarding-layout__sidebar">
					<Sidebar />
				</FlexItem>
				<FlexItem className="onboarding-layout__content" isBlock>
					<div className="onboarding-layout__canvas">
						<NavigatorScreen path="/">
							<Main />
						</NavigatorScreen>
						<NavigatorScreen path="/site-details">
							<SiteDetails />
						</NavigatorScreen>
						<NavigatorScreen path="/add-pages">
							<AddPages />
						</NavigatorScreen>
					</div>
				</FlexItem>
			</Flex>
		</NavigatorProvider>
	);
}
