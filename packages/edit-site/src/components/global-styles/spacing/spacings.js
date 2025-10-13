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
import ConfirmResetSpacingsDialog from './confirm-reset-spacings-dialog';

const { Menu } = unlock( componentsPrivateApis );
const { useGlobalSetting } = unlock( blockEditorPrivateApis );

function SpacingGroup( {
	label,
	origin,
	spacings,
	handleAddSpacing,
	handleResetSpacings,
} ) {
	const [ isResetDialogOpen, setIsResetDialogOpen ] = useState( false );

	const toggleResetDialog = () => setIsResetDialogOpen( ! isResetDialogOpen );

	const resetDialogText =
		origin === 'custom'
			? __(
					'Are you sure you want to remove all custom spacing presets?'
			  )
			: __(
					'Are you sure you want to reset all spacing presets to their default values?'
			  );

	return (
		<>
			{ isResetDialogOpen && (
				<ConfirmResetSpacingsDialog
					text={ resetDialogText }
					confirmButtonText={
						origin === 'custom' ? __( 'Remove' ) : __( 'Reset' )
					}
					isOpen={ isResetDialogOpen }
					toggleOpen={ toggleResetDialog }
					onConfirm={ handleResetSpacings }
				/>
			) }
			<VStack spacing={ 4 }>
				<HStack>
					<Subtitle level={ 3 }>{ label }</Subtitle>
					<FlexItem className="edit-site-global-styles__spacing-panel__options-container">
						{ origin === 'custom' && (
							<Button
								label={ __( 'Add spacing size' ) }
								icon={ plus }
								size="small"
								onClick={ handleAddSpacing }
							/>
						) }
						{ !! handleResetSpacings && (
							<Menu>
								<Menu.TriggerButton
									render={
										<Button
											size="small"
											icon={ moreVertical }
											label={ __(
												'Spacing size presets options'
											) }
										/>
									}
								/>
								<Menu.Popover>
									<Menu.Item onClick={ toggleResetDialog }>
										<Menu.ItemLabel>
											{ origin === 'custom'
												? __(
														'Remove spacing size presets'
												  )
												: __(
														'Reset spacing size presets'
												  ) }
										</Menu.ItemLabel>
									</Menu.Item>
								</Menu.Popover>
							</Menu>
						) }
					</FlexItem>
				</HStack>

				{ !! spacings.length && (
					<ItemGroup isBordered isSeparated>
						{ spacings.map( ( spacing ) => (
							<NavigationButtonAsItem
								key={ spacing.slug }
								path={ `/layout/spacing/${ origin }/${ spacing.slug }` }
							>
								<HStack>
									<FlexItem className="edit-site-spacing__item">
										{ spacing.name }
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

function Spacings() {
	const [ themeSpacingSizes, setThemeSpacingSizes ] = useGlobalSetting(
		'spacing.spacingSizes.theme'
	);

	const [ baseThemeSpacingSizes ] = useGlobalSetting(
		'spacing.spacingSizes.theme',
		null,
		'base'
	);
	const [ defaultSpacingSizes, setDefaultSpacingSizes ] = useGlobalSetting(
		'spacing.spacingSizes.default'
	);

	const [ baseDefaultSpacingSizes ] = useGlobalSetting(
		'spacing.spacingSizes.default',
		null,
		'base'
	);

	const [ customSpacingSizes = [], setCustomSpacingSizes ] = useGlobalSetting(
		'spacing.spacingSizes.custom'
	);

	const [ defaultSpacingSizesEnabled ] = useGlobalSetting(
		'spacing.defaultSpacingSizes'
	);

	const handleAddSpacing = () => {
		const index = getNewIndexFromPresets( customSpacingSizes, 'custom-' );
		const newSpacing = {
			/* translators: %d: spacing size index */
			name: sprintf( __( 'New Spacing Size %d' ), index ),
			size: '1rem',
			slug: `custom-${ index }`,
		};

		setCustomSpacingSizes( [ ...customSpacingSizes, newSpacing ] );
	};

	const hasSameSizeValues = ( arr1, arr2 ) =>
		arr1.map( ( item ) => item.size ).join( '' ) ===
		arr2.map( ( item ) => item.size ).join( '' );

	return (
		<VStack spacing={ 2 }>
			<ScreenHeader
				title={ __( 'Spacing size presets' ) }
				description={ __(
					'Create and edit the presets used for spacing sizes across the site.'
				) }
			/>

			<View>
				<Spacer paddingX={ 4 }>
					<VStack spacing={ 8 }>
						{ !! themeSpacingSizes?.length && (
							<SpacingGroup
								label={ __( 'Theme' ) }
								origin="theme"
								spacings={ themeSpacingSizes }
								baseSizes={ baseThemeSpacingSizes }
								handleAddSpacing={ handleAddSpacing }
								handleResetSpacings={
									hasSameSizeValues(
										themeSpacingSizes,
										baseThemeSpacingSizes
									)
										? null
										: () =>
												setThemeSpacingSizes(
													baseThemeSpacingSizes
												)
								}
							/>
						) }

						{ defaultSpacingSizesEnabled &&
							!! defaultSpacingSizes?.length && (
								<SpacingGroup
									label={ __( 'Default' ) }
									origin="default"
									spacings={ defaultSpacingSizes }
									baseSizes={ baseDefaultSpacingSizes }
									handleAddSpacing={ handleAddSpacing }
									handleResetSpacings={
										hasSameSizeValues(
											defaultSpacingSizes,
											baseDefaultSpacingSizes
										)
											? null
											: () =>
													setDefaultSpacingSizes(
														baseDefaultSpacingSizes
													)
									}
								/>
							) }

						<SpacingGroup
							label={ __( 'Custom' ) }
							origin="custom"
							spacings={ customSpacingSizes }
							handleAddSpacing={ handleAddSpacing }
							handleResetSpacings={
								customSpacingSizes.length > 0
									? () => setCustomSpacingSizes( [] )
									: null
							}
						/>
					</VStack>
				</Spacer>
			</View>
		</VStack>
	);
}

export default Spacings;
