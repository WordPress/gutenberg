/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalSpacer as Spacer,
	useNavigator,
	__experimentalView as View,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
	Button,
	FlexItem,
	ToggleControl,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { useState, useEffect } from '@wordpress/element';
import type {
	TypographyPreset,
	FluidTypographySettings,
	FontSize,
	FluidTypographyConfig,
} from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { ScreenHeader } from '../screen-header';
import FontSizePreview from './font-size-preview';
import ConfirmDeleteFontSizeDialog from './confirm-delete-font-size-dialog';
import RenameFontSizeDialog from './rename-font-size-dialog';
import { SizeControl } from '../size-control';
import { useSetting } from '../hooks';
import { unlock } from '../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

function FontSize() {
	const [ isDeleteConfirmOpen, setIsDeleteConfirmOpen ] = useState( false );
	const [ isRenameDialogOpen, setIsRenameDialogOpen ] = useState( false );

	const {
		params: { origin, slug },
		goBack,
	} = useNavigator();

	const [ fontSizes, setFontSizes ] = useSetting<
		Record< string, TypographyPreset[] > | undefined
	>( 'typography.fontSizes' );
	const [ globalFluid ] = useSetting<
		boolean | FluidTypographySettings | undefined
	>( 'typography.fluid' );

	// Get the font sizes from the origin, default to empty array.
	const sizes = fontSizes?.[ origin as string ] ?? [];

	// Get the font size by slug.
	const fontSize: FontSize | undefined = sizes.find(
		( size ) => size.slug === slug
	);

	// Navigate to the font sizes list if the font size is not available.
	useEffect( () => {
		if ( !! slug && ! fontSize ) {
			goBack();
		}
	}, [ slug, fontSize, goBack ] );

	if ( ! origin || ! slug || ! fontSize ) {
		return null;
	}

	// Whether the font size is fluid. If not defined, use the global fluid value of the theme.
	const isFluid =
		fontSize?.fluid !== undefined ? !! fontSize.fluid : !! globalFluid;

	// Whether custom fluid values are used.
	const isCustomFluid = typeof fontSize?.fluid === 'object';

	const handleNameChange = ( value: string ) => {
		updateFontSize( 'name', value );
	};

	const handleFontSizeChange = ( value: string | undefined ) => {
		updateFontSize( 'size', value );
	};

	const handleFluidChange = ( value: boolean ) => {
		updateFontSize( 'fluid', value );
	};

	const handleCustomFluidValues = ( value: boolean ) => {
		if ( value ) {
			// If custom values are used, init the values with the current ones.
			updateFontSize( 'fluid', {
				min: fontSize.size,
				max: fontSize.size,
			} );
		} else {
			// If custom fluid values are disabled, set fluid to true.
			updateFontSize( 'fluid', true );
		}
	};

	const handleMinChange = ( value: string | undefined ) => {
		const fluid: FluidTypographyConfig =
			typeof fontSize.fluid === 'object' ? fontSize.fluid : {};
		updateFontSize( 'fluid', { ...fluid, min: value } );
	};

	const handleMaxChange = ( value: string | undefined ) => {
		const fluid: FluidTypographyConfig =
			typeof fontSize.fluid === 'object' ? fontSize.fluid : {};
		updateFontSize( 'fluid', { ...fluid, max: value } );
	};

	const updateFontSize = ( key: string, value: any ) => {
		const newFontSizes = sizes.map( ( size ) => {
			if ( size.slug === slug ) {
				return { ...size, [ key ]: value }; // Create a new object with updated key
			}
			return size;
		} );

		setFontSizes( {
			...fontSizes,
			[ origin as string ]: newFontSizes,
		} );
	};

	const handleRemoveFontSize = () => {
		const newFontSizes = sizes.filter( ( size ) => size.slug !== slug );
		setFontSizes( {
			...fontSizes,
			[ origin as string ]: newFontSizes,
		} );
	};

	const toggleDeleteConfirm = () => {
		setIsDeleteConfirmOpen( ! isDeleteConfirmOpen );
	};

	const toggleRenameDialog = () => {
		setIsRenameDialogOpen( ! isRenameDialogOpen );
	};

	return (
		<>
			<ConfirmDeleteFontSizeDialog
				fontSize={ fontSize }
				isOpen={ isDeleteConfirmOpen }
				toggleOpen={ toggleDeleteConfirm }
				handleRemoveFontSize={ handleRemoveFontSize }
			/>

			{ isRenameDialogOpen && (
				<RenameFontSizeDialog
					fontSize={ fontSize }
					toggleOpen={ toggleRenameDialog }
					handleRename={ handleNameChange }
				/>
			) }

			<VStack spacing={ 4 }>
				<HStack justify="space-between" alignment="flex-start">
					<ScreenHeader
						title={ fontSize.name }
						description={ sprintf(
							/* translators: %s: font size preset name. */
							__( 'Manage the font size %s.' ),
							fontSize.name
						) }
					/>
					{ origin === 'custom' && (
						<FlexItem>
							<Spacer
								marginTop={ 3 }
								marginBottom={ 0 }
								paddingX={ 4 }
							>
								<Menu>
									<Menu.TriggerButton
										render={
											<Button
												size="small"
												icon={ moreVertical }
												label={ __(
													'Font size options'
												) }
											/>
										}
									/>
									<Menu.Popover>
										<Menu.Item
											onClick={ toggleRenameDialog }
										>
											<Menu.ItemLabel>
												{ __( 'Rename' ) }
											</Menu.ItemLabel>
										</Menu.Item>
										<Menu.Item
											onClick={ toggleDeleteConfirm }
										>
											<Menu.ItemLabel>
												{ __( 'Delete' ) }
											</Menu.ItemLabel>
										</Menu.Item>
									</Menu.Popover>
								</Menu>
							</Spacer>
						</FlexItem>
					) }
				</HStack>

				<View>
					<Spacer
						paddingX={ 4 }
						marginBottom={ 0 }
						paddingBottom={ 6 }
					>
						<VStack spacing={ 4 }>
							<FlexItem>
								<FontSizePreview fontSize={ fontSize } />
							</FlexItem>

							<SizeControl
								label={ __( 'Size' ) }
								value={
									! isCustomFluid && fontSize.size
										? String( fontSize.size )
										: ''
								}
								onChange={ handleFontSizeChange }
								disabled={ isCustomFluid }
							/>

							<ToggleControl
								label={ __( 'Fluid typography' ) }
								help={ __(
									'Scale the font size dynamically to fit the screen or viewport.'
								) }
								checked={ isFluid }
								onChange={ handleFluidChange }
							/>

							{ isFluid && (
								<ToggleControl
									label={ __( 'Custom fluid values' ) }
									help={ __(
										'Set custom min and max values for the fluid font size.'
									) }
									checked={ isCustomFluid }
									onChange={ handleCustomFluidValues }
								/>
							) }

							{ isCustomFluid && (
								<>
									<SizeControl
										label={ __( 'Minimum' ) }
										value={
											typeof fontSize?.fluid === 'object'
												? fontSize.fluid?.min
												: undefined
										}
										onChange={ handleMinChange }
									/>
									<SizeControl
										label={ __( 'Maximum' ) }
										value={
											typeof fontSize?.fluid === 'object'
												? fontSize.fluid?.max
												: undefined
										}
										onChange={ handleMaxChange }
									/>
								</>
							) }
						</VStack>
					</Spacer>
				</View>
			</VStack>
		</>
	);
}

export default FontSize;
