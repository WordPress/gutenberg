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
import { SiteDetails, AddPages, ChooseStyles } from '../navigation-screens';

export default function Layout() {
	const [ theme, setTheme ] = useState();
	const [ category, setCategory ] = useState();
	let step = 1;
	if ( theme ) {
		step = 2;
	}

	return (
		<NavigatorProvider className="onboarding-layout" initialPath="/">
			<Flex justify="flex-start" align="stretch">
				<VStack
					className="onboarding-layout__sidebar"
					alignment="topLeft"
				>
					<SiteHub />
					<Sidebar step={ step } />
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
						<NavigatorScreen path="/choose-styles">
							<ChooseStyles
								theme={ theme }
								category={ category }
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
