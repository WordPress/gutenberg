/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	FlexItem,
	CardBody,
	Card,
	CardDivider,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import StylesPreview from './preview';
import { NavigationButton } from './navigation-button';
import ContextMenu from './context-menu';

function ScreenRoot() {
	return (
		<Card size="small">
			<CardBody>
				<StylesPreview />
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
