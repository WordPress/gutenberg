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

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import SiteHub from '../site-hub';
import { SiteDetails, ChooseStyles, Launch } from '../navigation-screens';
import { useSelect } from '@wordpress/data';

export default function Layout() {
	const settings = useSelect(
		( select ) => select( editSiteStore ).getSettings(),
		[]
	);
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
				<GlobalStylesProvider setting={ settings }>
					<GlobalStylesRenderer />
					<BlockEditorProvider settings={ settings }>
						<FlexItem
							className="onboarding-layout__content"
							isBlock
						>
							<div className="onboarding-layout__canvas">
								<NavigatorScreen path="/">
									<SiteDetails
										theme={ theme }
										category={ category }
										setCategory={ setCategory }
										setTheme={ setTheme }
									/>
								</NavigatorScreen>

								<NavigatorScreen path="/step/2">
									<ChooseStyles
										theme={ theme }
										category={ category }
										variation={ variation }
										setVariation={ setVariation }
									/>
								</NavigatorScreen>
								<StyleBook
									isSelected={ () => {} }
									onSelect={ () => {} }
								/>
								<NavigatorScreen path="/step/3">
									<Launch
										theme={ theme }
										category={ category }
										variation={ variation }
									/>
								</NavigatorScreen>
							</div>
						</FlexItem>
					</BlockEditorProvider>
				</GlobalStylesProvider>
			</Flex>
		</NavigatorProvider>
	);
}
