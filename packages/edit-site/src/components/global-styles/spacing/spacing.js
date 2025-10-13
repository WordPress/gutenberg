/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
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

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import ScreenHeader from '../header';
import SpacingPreview from './spacing-preview';
import ConfirmDeleteSpacingDialog from './confirm-delete-spacing-dialog';
import RenameSpacingDialog from './rename-spacing-dialog';
import SizeControl from '../size-control';
import { parseClampValue, generateClampValue } from './utils';

const { Menu } = unlock( componentsPrivateApis );
const { useGlobalSetting } = unlock( blockEditorPrivateApis );

function Spacing() {
	const [ isDeleteConfirmOpen, setIsDeleteConfirmOpen ] = useState( false );
	const [ isRenameDialogOpen, setIsRenameDialogOpen ] = useState( false );

	const {
		params: { origin, slug },
		goBack,
	} = useNavigator();

	const [ spacingSizes, setSpacingSizes ] = useGlobalSetting(
		'spacing.spacingSizes'
	);

	// Get the spacing sizes from the origin, default to empty array.
	const sizes = spacingSizes[ origin ] ?? [];

	// Get the spacing size by slug.
	const originalSpacingSize = sizes.find( ( size ) => size.slug === slug );

	// Navigate to the spacing sizes list if the spacing size is not available.
	useEffect( () => {
		if ( !! slug && ! originalSpacingSize ) {
			goBack();
		}
	}, [ slug, originalSpacingSize, goBack ] );

	if ( ! origin || ! slug || ! originalSpacingSize ) {
		return null;
	}

	// Parse clamp value if it exists
	const clampValues = parseClampValue( originalSpacingSize.size );
	const isClampValue = !! clampValues;

	// Create normalized spacingSize for UI purposes
	let spacingSize = originalSpacingSize;
	if ( isClampValue ) {
		spacingSize = {
			...originalSpacingSize,
			size: clampValues.min,
			fluid: {
				min: clampValues.min,
				preferred: clampValues.preferred,
				max: clampValues.max,
			},
		};
	}

	// Whether the spacing size is fluid - check the original spacing size
	// If fluid property is explicitly set, use that value.
	// If no fluid property but there's a clamp value, default to true (fluid).
	// Otherwise default to false.
	const isFluid =
		originalSpacingSize?.fluid !== undefined
			? !! originalSpacingSize.fluid
			: isClampValue;

	// Whether custom fluid values are used - check the original spacing size
	// For clamp values without explicit fluid setting, they are considered custom fluid
	const isCustomFluid =
		typeof originalSpacingSize?.fluid === 'object' ||
		( isClampValue && originalSpacingSize?.fluid === undefined );

	const handleNameChange = ( value ) => {
		updateSpacingSize( 'name', value );
	};

	const handleSpacingSizeChange = ( value ) => {
		updateSpacingSize( 'size', value );
	};

	const handleFluidChange = ( value ) => {
		updateSpacingSize( 'fluid', value );
	};

	const handleCustomFluidValues = ( value ) => {
		if ( value ) {
			// If custom values are used, init the values with the current ones.
			updateSpacingSize( 'fluid', {
				min: spacingSize.size,
				preferred: spacingSize.size,
				max: spacingSize.size,
			} );
		} else {
			// If custom fluid values are disabled, set fluid to true.
			updateSpacingSize( 'fluid', true );
		}
	};

	const handleMinChange = ( value ) => {
		updateSpacingSize( 'fluid', { ...spacingSize.fluid, min: value } );
	};

	const handlePreferredChange = ( value ) => {
		updateSpacingSize( 'fluid', {
			...spacingSize.fluid,
			preferred: value,
		} );
	};

	const handleMaxChange = ( value ) => {
		updateSpacingSize( 'fluid', { ...spacingSize.fluid, max: value } );
	};

	const updateSpacingSize = ( key, value ) => {
		const newSpacingSizes = sizes.map( ( size ) => {
			if ( size.slug === slug ) {
				let updatedSize = { ...size, [ key ]: value };

				// Handle clamp values specially
				if ( isClampValue ) {
					if ( key === 'fluid' && typeof value === 'object' ) {
						// Convert fluid object back to clamp format
						const clampValue = generateClampValue(
							value.min,
							value.preferred,
							value.max
						);
						updatedSize = { ...updatedSize, size: clampValue };
					} else if ( key === 'fluid' && value === false ) {
						// When disabling fluid, convert to min value
						updatedSize = {
							...updatedSize,
							size: clampValues.min,
							fluid: false,
						};
					} else if ( key === 'fluid' && value === true ) {
						// When enabling simple fluid, keep original clamp
						updatedSize = {
							...updatedSize,
							size: generateClampValue(
								clampValues.min,
								clampValues.preferred,
								clampValues.max
							),
							fluid: true,
						};
					}
				}

				return updatedSize;
			}
			return size;
		} );

		setSpacingSizes( {
			...spacingSizes,
			[ origin ]: newSpacingSizes,
		} );
	};

	const handleRemoveSpacingSize = () => {
		const newSpacingSizes = sizes.filter( ( size ) => size.slug !== slug );
		setSpacingSizes( {
			...spacingSizes,
			[ origin ]: newSpacingSizes,
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
			<ConfirmDeleteSpacingDialog
				spacingSize={ spacingSize }
				isOpen={ isDeleteConfirmOpen }
				toggleOpen={ toggleDeleteConfirm }
				handleRemoveSpacingSize={ handleRemoveSpacingSize }
			/>

			{ isRenameDialogOpen && (
				<RenameSpacingDialog
					spacingSize={ spacingSize }
					toggleOpen={ toggleRenameDialog }
					handleRename={ handleNameChange }
				/>
			) }

			<VStack spacing={ 4 }>
				<HStack justify="space-between" align="flex-start">
					<ScreenHeader
						title={ spacingSize.name }
						description={ sprintf(
							/* translators: %s: spacing size preset name. */
							__( 'Manage the spacing size %s.' ),
							spacingSize.name
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
													'Spacing size options'
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
								<SpacingPreview spacingSize={ spacingSize } />
							</FlexItem>

							<SizeControl
								label={ __( 'Size' ) }
								value={
									! isCustomFluid ? spacingSize.size : ''
								}
								onChange={ handleSpacingSizeChange }
								disabled={ isCustomFluid }
								max={ 500 }
							/>

							<ToggleControl
								label={ __( 'Fluid spacing' ) }
								help={ __(
									'Scale the spacing size dynamically to fit the screen or viewport.'
								) }
								checked={ isFluid }
								onChange={ handleFluidChange }
								__nextHasNoMarginBottom
							/>

							{ isFluid && (
								<ToggleControl
									label={ __( 'Custom fluid values' ) }
									help={ __(
										'Set custom min, preferred, and max values for the fluid spacing size.'
									) }
									checked={ isCustomFluid }
									onChange={ handleCustomFluidValues }
									__nextHasNoMarginBottom
								/>
							) }

							{ isFluid && isCustomFluid && (
								<>
									<SizeControl
										label={ __( 'Minimum' ) }
										value={ spacingSize.fluid?.min }
										onChange={ handleMinChange }
										max={ 500 }
									/>
									<SizeControl
										label={ __( 'Preferred' ) }
										value={ spacingSize.fluid?.preferred }
										onChange={ handlePreferredChange }
										max={ 500 }
									/>
									<SizeControl
										label={ __( 'Maximum' ) }
										value={ spacingSize.fluid?.max }
										onChange={ handleMaxChange }
										max={ 500 }
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

export default Spacing;
