/**
 * WordPress dependencies
 */
import { __, sprintf, isRTL } from '@wordpress/i18n';
import {
	privateApis as componentsPrivateApis,
	__experimentalSpacer as Spacer,
	__experimentalView as View,
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
	Button,
} from '@wordpress/components';
import {
	Icon,
	plus,
	moreVertical,
	chevronLeft,
	chevronRight,
} from '@wordpress/icons';
import { useState } from '@wordpress/element';
import type { FontSize } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { Subtitle } from '../subtitle';
import { NavigationButtonAsItem } from '../navigation-button';
import { getNewIndexFromPresets } from '../utils';
import { ScreenHeader } from '../screen-header';
import ConfirmResetFontSizesDialog from './confirm-reset-font-sizes-dialog';
import { useSetting } from '../hooks';
import { unlock } from '../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

interface FontSizeGroupProps {
	label: string;
	origin: string;
	sizes: FontSize[];
	handleAddFontSize: () => void;
	handleResetFontSizes?: () => void;
}

function FontSizeGroup( {
	label,
	origin,
	sizes,
	handleAddFontSize,
	handleResetFontSizes,
}: FontSizeGroupProps ) {
	const [ isResetDialogOpen, setIsResetDialogOpen ] = useState( false );

	const toggleResetDialog = () => setIsResetDialogOpen( ! isResetDialogOpen );

	const resetDialogText =
		origin === 'custom'
			? __(
					'Are you sure you want to remove all custom font size presets?'
			  )
			: __(
					'Are you sure you want to reset all font size presets to their default values?'
			  );

	return (
		<>
			{ handleResetFontSizes && isResetDialogOpen && (
				<ConfirmResetFontSizesDialog
					text={ resetDialogText }
					confirmButtonText={
						origin === 'custom' ? __( 'Remove' ) : __( 'Reset' )
					}
					isOpen={ isResetDialogOpen }
					toggleOpen={ toggleResetDialog }
					onConfirm={ handleResetFontSizes }
				/>
			) }
			<VStack spacing={ 4 }>
				<HStack>
					<Subtitle level={ 3 }>{ label }</Subtitle>
					<FlexItem className="global-styles-ui__typography-panel__options-container">
						{ origin === 'custom' && (
							<Button
								label={ __( 'Add font size' ) }
								icon={ plus }
								size="small"
								onClick={ handleAddFontSize }
							/>
						) }
						{ !! handleResetFontSizes && (
							<Menu>
								<Menu.TriggerButton
									render={
										<Button
											size="small"
											icon={ moreVertical }
											label={ __(
												'Font size presets options'
											) }
										/>
									}
								/>
								<Menu.Popover>
									<Menu.Item onClick={ toggleResetDialog }>
										<Menu.ItemLabel>
											{ origin === 'custom'
												? __(
														'Remove font size presets'
												  )
												: __(
														'Reset font size presets'
												  ) }
										</Menu.ItemLabel>
									</Menu.Item>
								</Menu.Popover>
							</Menu>
						) }
					</FlexItem>
				</HStack>

				{ !! sizes.length && (
					<ItemGroup isBordered isSeparated>
						{ sizes.map( ( size ) => (
							<NavigationButtonAsItem
								key={ size.slug }
								path={ `/typography/font-sizes/${ origin }/${ size.slug }` }
							>
								<HStack>
									<FlexItem className="global-styles-ui-font-size__item">
										{ size.name }
									</FlexItem>
									<FlexItem display="flex">
										<Icon
											icon={
												isRTL()
													? chevronLeft
													: chevronRight
											}
										/>
									</FlexItem>
								</HStack>
							</NavigationButtonAsItem>
						) ) }
					</ItemGroup>
				) }
			</VStack>
		</>
	);
}

function FontSizes() {
	const [ themeFontSizes, setThemeFontSizes ] = useSetting(
		'typography.fontSizes.theme'
	);

	const [ baseThemeFontSizes ] = useSetting(
		'typography.fontSizes.theme',
		'base'
	);
	const [ defaultFontSizes, setDefaultFontSizes ] = useSetting(
		'typography.fontSizes.default'
	);

	const [ baseDefaultFontSizes ] = useSetting(
		'typography.fontSizes.default',
		'base'
	);

	const [ customFontSizes = [], setCustomFontSizes ] = useSetting(
		'typography.fontSizes.custom'
	);

	const [ defaultFontSizesEnabled ] = useSetting(
		'typography.defaultFontSizes'
	);

	const handleAddFontSize = () => {
		const index = getNewIndexFromPresets( customFontSizes, 'custom-' );
		const newFontSize = {
			/* translators: %d: font size index */
			name: sprintf( __( 'New Font Size %d' ), index ),
			size: '16px',
			slug: `custom-${ index }`,
		};

		setCustomFontSizes( [ ...customFontSizes, newFontSize ] );
	};

	const hasSameSizeValues = ( arr1: FontSize[], arr2: FontSize[] ): boolean =>
		arr1.map( ( item ) => item.size ).join( '' ) ===
		arr2.map( ( item ) => item.size ).join( '' );

	return (
		<VStack spacing={ 2 }>
			<ScreenHeader
				title={ __( 'Font size presets' ) }
				description={ __(
					'Create and edit the presets used for font sizes across the site.'
				) }
			/>

			<View>
				<Spacer paddingX={ 4 }>
					<VStack spacing={ 8 }>
						{ !! themeFontSizes?.length && (
							<FontSizeGroup
								label={ __( 'Theme' ) }
								origin="theme"
								sizes={ themeFontSizes }
								handleAddFontSize={ handleAddFontSize }
								handleResetFontSizes={
									hasSameSizeValues(
										themeFontSizes,
										baseThemeFontSizes
									)
										? undefined
										: () =>
												setThemeFontSizes(
													baseThemeFontSizes
												)
								}
							/>
						) }

						{ defaultFontSizesEnabled &&
							!! defaultFontSizes?.length && (
								<FontSizeGroup
									label={ __( 'Default' ) }
									origin="default"
									sizes={ defaultFontSizes }
									handleAddFontSize={ handleAddFontSize }
									handleResetFontSizes={
										hasSameSizeValues(
											defaultFontSizes,
											baseDefaultFontSizes
										)
											? undefined
											: () =>
													setDefaultFontSizes(
														baseDefaultFontSizes
													)
									}
								/>
							) }

						<FontSizeGroup
							label={ __( 'Custom' ) }
							origin="custom"
							sizes={ customFontSizes }
							handleAddFontSize={ handleAddFontSize }
							handleResetFontSizes={
								customFontSizes.length > 0
									? () => setCustomFontSizes( [] )
									: undefined
							}
						/>
					</VStack>
				</Spacer>
			</View>
		</VStack>
	);
}

export default FontSizes;
