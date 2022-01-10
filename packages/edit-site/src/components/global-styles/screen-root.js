/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	FlexItem,
	CardBody,
	Card,
	CardDivider,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight, Icon } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { NavigationButton } from './navigation-button';
import ContextMenu from './context-menu';
import StylesPreview from './preview';

function ScreenRoot() {
	const { variations } = useSelect( ( select ) => {
		return {
			variations: select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations(),
		};
	}, [] );

	return (
		<Card size="small">
			<CardBody>
				<VStack spacing={ 2 }>
					<StylesPreview />
					{ !! variations?.length && (
						<NavigationButton path="/variations">
							<HStack justify="space-between">
								<FlexItem>{ __( 'Other styles' ) }</FlexItem>
								<FlexItem>
									<Icon
										icon={
											isRTL() ? chevronLeft : chevronRight
										}
									/>
								</FlexItem>
							</HStack>
						</NavigationButton>
					) }
				</VStack>
			</CardBody>

			<CardBody>
				<ContextMenu />
			</CardBody>

			<CardDivider />

			<CardBody>
				<ItemGroup>
					<Item>
						{ __(
							'Customize the appearance of specific blocks for the whole site.'
						) }
					</Item>
					<NavigationButton path="/blocks">
						<HStack justify="space-between">
							<FlexItem>{ __( 'Blocks' ) }</FlexItem>
							<FlexItem>
								<Icon
									icon={
										isRTL() ? chevronLeft : chevronRight
									}
								/>
							</FlexItem>
						</HStack>
					</NavigationButton>
				</ItemGroup>
			</CardBody>
		</Card>
	);
}

export default ScreenRoot;
