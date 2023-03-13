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
// eslint-disable-next-line no-restricted-imports
import {
	GlobalStylesProvider,
	StyleBook,
	GlobalStylesRenderer,
	store as editSiteStore,
} from '@wordpress/edit-site';
import { BlockEditorProvider } from '@wordpress/block-editor';

// import { StyleBook } from '@wordpress/edit-site';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import SiteHub from '../site-hub';
import { SiteDetails, AddPages, ChooseStyles } from '../navigation-screens';
import { useSelect } from '@wordpress/data';

export default function Layout() {
	const settings = useSelect( ( select ) => {
		const sets = select( editSiteStore ).getSettings();
		return sets;
	}, [] );
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
						<GlobalStylesProvider>
							<GlobalStylesRenderer />
							<BlockEditorProvider settings={ settings }>
								<NavigatorScreen path="/step/2">
									<ChooseStyles
										theme={ theme }
										category={ category }
									/>
								</NavigatorScreen>
								<StyleBook
									isSelected={ () => {} }
									onSelect={ () => {} }
									// onClose={  }
								/>
							</BlockEditorProvider>
						</GlobalStylesProvider>
						<NavigatorScreen path="/step/3">
							<AddPages />
						</NavigatorScreen>
					</div>
				</FlexItem>
			</Flex>
		</NavigatorProvider>
	);
}
