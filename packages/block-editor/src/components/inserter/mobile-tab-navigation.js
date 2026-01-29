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
	Navigator,
	FlexBlock,
} from '@wordpress/components';
import { Icon, chevronRight, chevronLeft } from '@wordpress/icons';

function ScreenHeader( { title } ) {
	return (
		<VStack spacing={ 0 }>
			<View>
				<Spacer marginBottom={ 0 } paddingX={ 4 } paddingY={ 3 }>
					<HStack spacing={ 2 }>
						<Navigator.BackButton
							style={
								// TODO: This style override is also used in ToolsPanelHeader.
								// It should be supported out-of-the-box by Button.
								{ minWidth: 24, padding: 0 }
							}
							icon={ isRTL() ? chevronRight : chevronLeft }
							size="small"
							label={ __( 'Back' ) }
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
		<Navigator
			initialPath="/"
			className="block-editor-inserter__mobile-tab-navigation"
		>
			<Navigator.Screen path="/">
				<ItemGroup>
					{ categories.map( ( category ) => (
						<Navigator.Button
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
						</Navigator.Button>
					) ) }
				</ItemGroup>
			</Navigator.Screen>
			{ categories.map( ( category ) => (
				<Navigator.Screen
					key={ category.name }
					path={ `/category/${ category.name }` }
				>
					<ScreenHeader title={ __( 'Back' ) } />
					{ children( category ) }
				</Navigator.Screen>
			) ) }
		</Navigator>
	);
}
