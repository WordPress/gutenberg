/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
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

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import Subtitle from '../subtitle';
import { NavigationButtonAsItem } from '../navigation-button';
import { getNewIndexFromPresets } from '../utils';
import ScreenHeader from '../header';
import ConfirmResetFontSizesDialog from './confirm-reset-font-sizes-dialog';

const { Menu } = unlock( componentsPrivateApis );
const { useGlobalSetting } = unlock( blockEditorPrivateApis );

function FontSizeGroup( {
	label,
	origin,
	sizes,
	handleAddFontSize,
	handleResetFontSizes,
} ) {
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
			{ isResetDialogOpen && (
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
					<FlexItem className="edit-site-global-styles__typography-panel__options-container">
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
									<FlexItem className="edit-site-font-size__item">
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
	const [ themeFontSizes, setThemeFontSizes ] = useGlobalSetting(
		'typography.fontSizes.theme'
	);

	const [ baseThemeFontSizes ] = useGlobalSetting(
		'typography.fontSizes.theme',
		null,
		'base'
	);
	const [ defaultFontSizes, setDefaultFontSizes ] = useGlobalSetting(
		'typography.fontSizes.default'
	);

	const [ baseDefaultFontSizes ] = useGlobalSetting(
		'typography.fontSizes.default',
		null,
		'base'
	);

	const [ customFontSizes = [], setCustomFontSizes ] = useGlobalSetting(
		'typography.fontSizes.custom'
	);

	const [ defaultFontSizesEnabled ] = useGlobalSetting(
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

	const hasSameSizeValues = ( arr1, arr2 ) =>
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
								baseSizes={ baseThemeFontSizes }
								handleAddFontSize={ handleAddFontSize }
								handleResetFontSizes={
									hasSameSizeValues(
										themeFontSizes,
										baseThemeFontSizes
									)
										? null
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
									baseSizes={ baseDefaultFontSizes }
									handleAddFontSize={ handleAddFontSize }
									handleResetFontSizes={
										hasSameSizeValues(
											defaultFontSizes,
											baseDefaultFontSizes
										)
											? null
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
									: null
							}
						/>
					</VStack>
				</Spacer>
			</View>
		</VStack>
	);
}

export default FontSizes;
