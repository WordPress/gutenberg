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
	CardMedia,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { IconWithCurrentColor } from './icon-with-current-color';
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
					<Card>
						<CardMedia>
							<StylesPreview />
						</CardMedia>
					</Card>
					{ !! variations?.length && (
						<NavigationButton path="/variations">
							<HStack justify="space-between">
								<FlexItem>{ __( 'Browse styles' ) }</FlexItem>
								<IconWithCurrentColor
									icon={
										isRTL() ? chevronLeft : chevronRight
									}
								/>
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
							<IconWithCurrentColor
								icon={ isRTL() ? chevronLeft : chevronRight }
							/>
						</HStack>
					</NavigationButton>
				</ItemGroup>
			</CardBody>
		</Card>
	);
}

export default ScreenRoot;
