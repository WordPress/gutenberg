/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	FlexItem,
	CardBody,
	CardDivider,
} from '@wordpress/components';
import {
	typography,
	border,
	color,
	layout,
	chevronLeft,
	chevronRight,
} from '@wordpress/icons';
import { isRTL, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useHasBorderPanel } from './border-panel';
import { useHasColorPanel } from './color-utils';
import { useHasDimensionsPanel } from './dimensions-panel';
import { useHasTypographyPanel } from './typography-panel';
import { NavigationButtonAsItem } from './navigation-button';
import { IconWithCurrentColor } from './icon-with-current-color';

function ContextMenu( { name, parentMenu = '' } ) {
	const hasTypographyPanel = useHasTypographyPanel( name );
	const hasColorPanel = useHasColorPanel( name );
	const hasBorderPanel = useHasBorderPanel( name );
	const hasDimensionsPanel = useHasDimensionsPanel( name );
	const hasLayoutPanel = hasDimensionsPanel;

	return (
		<>
			<ItemGroup>
				{ hasTypographyPanel && (
					<NavigationButtonAsItem
						icon={ typography }
						path={ parentMenu + '/typography' }
						aria-label={ __( 'Typography styles' ) }
					>
						{ __( 'Typography' ) }
					</NavigationButtonAsItem>
				) }
				{ hasColorPanel && (
					<NavigationButtonAsItem
						icon={ color }
						path={ parentMenu + '/colors' }
						aria-label={ __( 'Colors styles' ) }
					>
						{ __( 'Colors' ) }
					</NavigationButtonAsItem>
				) }
				{ hasBorderPanel && (
					<NavigationButtonAsItem
						icon={ border }
						path={ parentMenu + '/border' }
						aria-label={ __( 'Border styles' ) }
					>
						{ __( 'Border' ) }
					</NavigationButtonAsItem>
				) }
				{ hasLayoutPanel && (
					<NavigationButtonAsItem
						icon={ layout }
						path={ parentMenu + '/layout' }
						aria-label={ __( 'Layout styles' ) }
					>
						{ __( 'Layout' ) }
					</NavigationButtonAsItem>
				) }
			</ItemGroup>
			{ !! parentMenu && (
				<>
					<CardDivider />
					<CardBody>
						<Spacer
							as="p"
							paddingTop={ 2 }
							paddingX="13px"
							marginBottom={ 4 }
						>
							{ __(
								'Add your own CSS to customize the block appearance.'
							) }
						</Spacer>
						<ItemGroup>
							<NavigationButtonAsItem
								path={ parentMenu + '/css' }
								aria-label={ __( 'Additional CSS' ) }
							>
								<HStack justify="space-between">
									<FlexItem>{ __( 'Custom' ) }</FlexItem>
									<IconWithCurrentColor
										icon={
											isRTL() ? chevronLeft : chevronRight
										}
									/>
								</HStack>
							</NavigationButtonAsItem>
						</ItemGroup>
					</CardBody>
				</>
			) }
		</>
	);
}

export default ContextMenu;
