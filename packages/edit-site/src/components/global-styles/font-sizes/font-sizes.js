/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
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
import { plus, moreVertical } from '@wordpress/icons';

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

function FontSizeGroup( {
	label,
	origin,
	sizes,
	handleAddFontSize,
	handleResetFontSizes,
} ) {
	return (
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
							<DropdownMenuItem onClick={ handleResetFontSizes }>
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
							<HStack justify="space-between">
								<FlexItem className="edit-site-font-size__item">
									{ size.name }
								</FlexItem>
								``
								<FlexItem className="edit-site-font-size__item edit-site-font-size__item-value">
									{ size.size }
								</FlexItem>
							</HStack>
						</NavigationButtonAsItem>
					) ) }
				</ItemGroup>
			) }
		</VStack>
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
				description={ __( 'Manage the font size presets' ) }
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
