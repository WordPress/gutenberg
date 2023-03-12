/**
 * WordPress dependencies
 */
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalVStack as VStack,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import SiteHub from '../site-hub';
import { SiteDetails, AddPages } from '../navigation-screens';

export default function Layout() {
	const [ theme, setTheme ] = useState();
	const [ category, setCategory ] = useState();

	return (
		<NavigatorProvider className="onboarding-layout" initialPath="/">
			<Flex justify="flex-start" align="stretch">
				<VStack
					className="onboarding-layout__sidebar"
					alignment="topLeft"
				>
					<SiteHub />
					<Sidebar />
				</VStack>
				<FlexItem className="onboarding-layout__content" isBlock>
					<div className="onboarding-layout__canvas">
						<NavigatorScreen path="/">
							<SiteDetails
								theme={ theme }
								category={ category }
								setCategory={ setCategory }
								setTheme={ setTheme }
							/>
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
