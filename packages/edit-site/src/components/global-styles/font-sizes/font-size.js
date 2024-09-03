/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalSpacer as Spacer,
	__experimentalUseNavigator as useNavigator,
	__experimentalView as View,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
	Button,
	FlexItem,
	ToggleControl,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import ScreenHeader from '../header';
import FontSizePreview from './font-size-preview';
import ConfirmDeleteFontSizeDialog from './confirm-delete-font-size-dialog';
import RenameFontSizeDialog from './rename-font-size-dialog';
import SizeControl from '../size-control';

const { DropdownMenuV2 } = unlock( componentsPrivateApis );
const { useGlobalSetting } = unlock( blockEditorPrivateApis );

function FontSize() {
	const [ isDeleteConfirmOpen, setIsDeleteConfirmOpen ] = useState( false );
	const [ isRenameDialogOpen, setIsRenameDialogOpen ] = useState( false );

	const {
		params: { origin, slug },
		goBack,
		goTo,
	} = useNavigator();

	const [ fontSizes, setFontSizes ] = useGlobalSetting(
		'typography.fontSizes'
	);

	const [ globalFluid ] = useGlobalSetting( 'typography.fluid' );

	// Get the font sizes from the origin, default to empty array.
	const sizes = fontSizes[ origin ] ?? [];

	// Get the font size by slug.
	const fontSize = sizes.find( ( size ) => size.slug === slug );

	// Whether the font size is fluid. If not defined, use the global fluid value of the theme.
	const isFluid =
		fontSize.fluid !== undefined ? !! fontSize.fluid : !! globalFluid;

	// Whether custom fluid values are used.
	const isCustomFluid = typeof fontSize.fluid === 'object';

	const handleNameChange = ( value ) => {
		updateFontSize( 'name', value );
	};

	const handleFontSizeChange = ( value ) => {
		updateFontSize( 'size', value );
	};

	const handleFluidChange = ( value ) => {
		updateFontSize( 'fluid', value );
	};

	const handleCustomFluidValues = ( value ) => {
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

	const handleMinChange = ( value ) => {
		updateFontSize( 'fluid', { ...fontSize.fluid, min: value } );
	};

	const handleMaxChange = ( value ) => {
		updateFontSize( 'fluid', { ...fontSize.fluid, max: value } );
	};

	const updateFontSize = ( key, value ) => {
		const newFontSizes = sizes.map( ( size ) => {
			if ( size.slug === slug ) {
				return { ...size, [ key ]: value }; // Create a new object with updated key
			}
			return size;
		} );

		setFontSizes( {
			...fontSizes,
			[ origin ]: newFontSizes,
		} );
	};

	const handleRemoveFontSize = () => {
		// Navigate to the font sizes list.
		goBack();

		const newFontSizes = sizes.filter( ( size ) => size.slug !== slug );
		setFontSizes( {
			...fontSizes,
			[ origin ]: newFontSizes,
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
				<HStack justify="space-between" align="flex-start">
					<ScreenHeader
						title={ fontSize.name }
						description={ sprintf(
							/* translators: %s: font size preset name. */
							__( 'Manage the font size %s.' ),
							fontSize.name
						) }
						onBack={ () => goTo( '/typography/font-sizes/' ) }
					/>
					{ origin === 'custom' && (
						<FlexItem>
							<Spacer
								marginTop={ 3 }
								marginBottom={ 0 }
								paddingX={ 4 }
							>
								<DropdownMenuV2
									trigger={
										<Button
											size="small"
											icon={ moreVertical }
											label={ __( 'Font size options' ) }
										/>
									}
								>
									<DropdownMenuV2.Item
										onClick={ toggleRenameDialog }
									>
										<DropdownMenuV2.ItemLabel>
											{ __( 'Rename' ) }
										</DropdownMenuV2.ItemLabel>
									</DropdownMenuV2.Item>
									<DropdownMenuV2.Item
										onClick={ toggleDeleteConfirm }
									>
										<DropdownMenuV2.ItemLabel>
											{ __( 'Delete' ) }
										</DropdownMenuV2.ItemLabel>
									</DropdownMenuV2.Item>
								</DropdownMenuV2>
							</Spacer>
						</FlexItem>
					) }
				</HStack>

				<View>
					<Spacer paddingX={ 4 }>
						<VStack spacing={ 4 }>
							<FlexItem>
								<FontSizePreview fontSize={ fontSize } />
							</FlexItem>

							<SizeControl
								label={ __( 'Size' ) }
								value={ ! isCustomFluid ? fontSize.size : '' }
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
								__nextHasNoMarginBottom
							/>

							{ isFluid && (
								<ToggleControl
									label={ __( 'Custom fluid values' ) }
									help={ __(
										'Set custom min and max values for the fluid font size.'
									) }
									checked={ isCustomFluid }
									onChange={ handleCustomFluidValues }
									__nextHasNoMarginBottom
								/>
							) }

							{ isCustomFluid && (
								<>
									<SizeControl
										label={ __( 'Minimum' ) }
										value={ fontSize.fluid?.min }
										onChange={ handleMinChange }
									/>
									<SizeControl
										label={ __( 'Maximum' ) }
										value={ fontSize.fluid?.max }
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
