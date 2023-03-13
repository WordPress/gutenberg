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
import ScreenChooseStyles from '../screen-choose-styles';
import ScreenThemePicker from '../screen-theme-picker';
import ScreenLaunch from '../screen-launch';

export default function Layout() {
	const [ theme, setTheme ] = useState();
	const [ category, setCategory ] = useState();
	const [ variation, setVariation ] = useState();
	let step = 1;
	if ( theme ) {
		step = 2;
	}
	if ( variation ) {
		step = 3;
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
							<ScreenThemePicker
								theme={ theme }
								category={ category }
								setCategory={ setCategory }
								setTheme={ setTheme }
							/>
						</NavigatorScreen>
						<NavigatorScreen path="/step/2">
							<ScreenChooseStyles
								theme={ theme }
								category={ category }
								variation={ variation }
								setVariation={ setVariation }
							/>
						</NavigatorScreen>
						<NavigatorScreen path="/step/3">
							<ScreenLaunch
								theme={ theme }
								category={ category }
								variation={ variation }
							/>
						</NavigatorScreen>
					</div>
				</FlexItem>
			</Flex>
		</NavigatorProvider>
	);
}
