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
const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );
const { useGlobalSetting } = unlock( blockEditorPrivateApis );
import Subtitle from '../subtitle';
import { NavigationButtonAsItem } from '../navigation-button';
import { getNewIndexFromPresets } from '../utils';
import ScreenHeader from '../header';
import ConfirmResetFontSizesDialog from './confirm-reset-font-sizes-dialog';

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
				<HStack justify="space-between" align="center">
					<Subtitle level={ 3 }>{ label }</Subtitle>
					<FlexItem>
						{ origin === 'custom' && (
							<Button
								label={ __( 'Add font size' ) }
								icon={ plus }
								size="small"
								onClick={ handleAddFontSize }
							/>
						) }
						{ !! handleResetFontSizes && (
							<DropdownMenu
								trigger={
									<Button
										size="small"
										icon={ moreVertical }
										label={ __( 'Menu' ) }
									/>
								}
							>
								<DropdownMenuItem onClick={ toggleResetDialog }>
									<DropdownMenuItemLabel>
										{ origin === 'custom'
											? __( 'Remove font size presets' )
											: __( 'Reset font size presets' ) }
									</DropdownMenuItemLabel>
								</DropdownMenuItem>
							</DropdownMenu>
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
								<HStack direction="row">
									<FlexItem className="edit-site-font-size__item">
										{ size.name }
									</FlexItem>
									<FlexItem>
										<HStack justify="flex-end">
											<FlexItem className="edit-site-font-size__item edit-site-font-size__item-value">
												{ size.size }
											</FlexItem>
											<Icon
												icon={
													isRTL()
														? chevronLeft
														: chevronRight
												}
											/>
										</HStack>
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
									themeFontSizes !== baseThemeFontSizes
										? () =>
												setThemeFontSizes(
													baseThemeFontSizes
												)
										: null
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
										defaultFontSizes !==
										baseDefaultFontSizes
											? () =>
													setDefaultFontSizes(
														baseDefaultFontSizes
													)
											: null
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
