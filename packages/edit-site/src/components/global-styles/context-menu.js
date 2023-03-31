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
	filter,
	shadow,
	color,
	layout,
	chevronLeft,
	chevronRight,
} from '@wordpress/icons';
import { isRTL, __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useHasFilterPanel } from './filter-utils';
import { useHasVariationsPanel } from './variations-panel';
import { NavigationButtonAsItem } from './navigation-button';
import { IconWithCurrentColor } from './icon-with-current-color';
import { ScreenVariations } from './screen-variations';
import { useHasShadowControl } from './shadow-panel';
import { unlock } from '../../private-apis';

const {
	useHasDimensionsPanel,
	useHasTypographyPanel,
	useHasBorderPanel,
	useHasColorPanel,
	useGlobalSetting,
	useSettingsForBlockElement,
} = unlock( blockEditorPrivateApis );

function ContextMenu( { name, parentMenu = '' } ) {
	const [ rawSettings ] = useGlobalSetting( '', name );
	const settings = useSettingsForBlockElement( rawSettings, name );
	const hasTypographyPanel = useHasTypographyPanel( settings );
	const hasColorPanel = useHasColorPanel( settings );
	const hasBorderPanel = useHasBorderPanel( settings );
	const hasEffectsPanel = useHasShadowControl( name );
	const hasFilterPanel = useHasFilterPanel( name );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	const hasLayoutPanel = hasDimensionsPanel;
	const hasVariationsPanel = useHasVariationsPanel( name, parentMenu );

	const { canEditCSS } = useSelect( ( select ) => {
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );

		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;

		return {
			canEditCSS:
				!! globalStyles?._links?.[ 'wp:action-edit-css' ] ?? false,
		};
	}, [] );

	const isBlocksPanel =
		parentMenu.includes( 'blocks' ) &&
		! parentMenu.includes( 'variations' );

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
						aria-label={ __( 'Border' ) }
					>
						{ __( 'Border' ) }
					</NavigationButtonAsItem>
				) }
				{ hasEffectsPanel && (
					<NavigationButtonAsItem
						icon={ shadow }
						path={ parentMenu + '/effects' }
						aria-label={ __( 'Shadow' ) }
					>
						{ __( 'Shadow' ) }
					</NavigationButtonAsItem>
				) }
				{ hasFilterPanel && (
					<NavigationButtonAsItem
						icon={ filter }
						path={ parentMenu + '/filters' }
						aria-label={ __( 'Filters styles' ) }
					>
						{ __( 'Filters' ) }
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
				{ hasVariationsPanel && (
					<ScreenVariations name={ name } path={ parentMenu } />
				) }
				{ isBlocksPanel && canEditCSS && (
					<>
						<CardDivider />
						<CardBody>
							<Spacer as="p" paddingTop={ 2 } marginBottom={ 4 }>
								{ __(
									'Add your own CSS to customize the block appearance.'
								) }
							</Spacer>
							<ItemGroup>
								<NavigationButtonAsItem
									path={ parentMenu + '/css' }
									aria-label={ __( 'Additional block CSS' ) }
								>
									<HStack justify="space-between">
										<FlexItem>
											{ __( 'Additional block CSS' ) }
										</FlexItem>
										<IconWithCurrentColor
											icon={
												isRTL()
													? chevronLeft
													: chevronRight
											}
										/>
									</HStack>
								</NavigationButtonAsItem>
							</ItemGroup>
						</CardBody>
						<CardDivider />
					</>
				) }
			</ItemGroup>
		</>
	);
}

export default ContextMenu;
