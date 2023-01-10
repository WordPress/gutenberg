/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalHeading as Heading,
	__experimentalView as View,
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalNavigatorButton as NavigatorButton,
	__experimentalNavigatorBackButton as NavigatorBackButton,
	FlexBlock,
} from '@wordpress/components';
import { Icon, chevronRight, chevronLeft } from '@wordpress/icons';

function ScreenHeader( { title } ) {
	return (
		<VStack spacing={ 0 }>
			<View>
				<Spacer marginBottom={ 0 } paddingX={ 4 } paddingY={ 3 }>
					<HStack spacing={ 2 }>
						<NavigatorBackButton
							style={
								// TODO: This style override is also used in ToolsPanelHeader.
								// It should be supported out-of-the-box by Button.
								{ minWidth: 24, padding: 0 }
							}
							icon={ isRTL() ? chevronRight : chevronLeft }
							isSmall
							aria-label={ __( 'Navigate to the previous view' ) }
						/>
						<Spacer>
							<Heading level={ 5 }>{ title }</Heading>
						</Spacer>
					</HStack>
				</Spacer>
			</View>
		</VStack>
	);
}

export default function MobileTabNavigation( { categories, children } ) {
	return (
		<NavigatorProvider
			initialPath="/"
			className="block-editor-inserter__mobile-tab-navigation"
		>
			<NavigatorScreen path="/">
				<ItemGroup>
					{ categories.map( ( category ) => (
						<NavigatorButton
							key={ category.name }
							path={ `/category/${ category.name }` }
							as={ Item }
							isAction
						>
							<HStack>
								<FlexBlock>{ category.label }</FlexBlock>
								<Icon
									icon={
										isRTL() ? chevronLeft : chevronRight
									}
								/>
							</HStack>
						</NavigatorButton>
					) ) }
				</ItemGroup>
			</NavigatorScreen>
			{ categories.map( ( category ) => (
				<NavigatorScreen
					key={ category.name }
					path={ `/category/${ category.name }` }
				>
					<ScreenHeader title={ __( 'Back' ) } />
					{ children( category ) }
				</NavigatorScreen>
			) ) }
		</NavigatorProvider>
	);
}
