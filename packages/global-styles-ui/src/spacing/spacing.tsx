import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalSpacer as Spacer,
	__experimentalView as View,
	useNavigator,
	FlexItem,
	ToggleControl,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import type {
	SpacingSize,
	FluidSpacingConfig,
} from '@wordpress/global-styles-engine';
import { Stack } from '@wordpress/ui';
import SpacingPreview from './spacing-preview';
import { SizeControl } from '../size-control';
import { usePresets } from '../presets/use-presets';
import PresetEditHeader from '../presets/preset-edit-header';
import type { PresetEditHeaderMenuItem } from '../presets/preset-edit-header';
import ConfirmDeleteDialog from '../presets/dialogs/confirm-delete-dialog';
import RenameDialog from '../presets/dialogs/rename-dialog';
import { parseClampValue, generateClampValue } from './utils';

function Spacing() {
	const { params, goBack } = useNavigator();
	const origin = params.origin as string;
	const slug = params.slug as string;

	const { presets, setPresets } = usePresets< SpacingSize >(
		'spacing.spacingSizes',
		origin
	);

	const preset = presets.find( ( p ) => p.slug === slug );

	const [ isDeleteOpen, setIsDeleteOpen ] = useState( false );
	const [ isRenameOpen, setIsRenameOpen ] = useState( false );

	// The preset can disappear while its screen is open, e.g. when presets are
	// reset globally. Navigate back to the spacing sizes list in that case.
	useEffect( () => {
		if ( !! slug && ! preset ) {
			goBack();
		}
	}, [ slug, preset, goBack ] );

	if ( ! origin || ! slug || ! preset ) {
		return null;
	}

	const clampValues = parseClampValue( String( preset.size ) );
	const isClampValue = !! clampValues;

	// Themes commonly author spacing presets directly as a `clamp()` string
	// rather than as a fluid object. Present those as their three parts so
	// they can be edited part by part, without rewriting the stored value.
	const spacingSize: SpacingSize = isClampValue
		? {
				...preset,
				size: String( clampValues.min ),
				fluid: {
					min: clampValues.min,
					preferred: clampValues.preferred,
					max: clampValues.max,
				},
		  }
		: preset;

	// If the fluid property is explicitly set, use it. Otherwise a `clamp()`
	// value counts as fluid, and anything else does not.
	const isFluid = preset.fluid !== undefined ? !! preset.fluid : isClampValue;

	const isCustomFluid =
		typeof preset.fluid === 'object' ||
		( isClampValue && preset.fluid === undefined );

	const set = ( key: keyof SpacingSize, value: unknown ) =>
		setPresets(
			presets.map( ( p ) => {
				if ( p.slug !== slug ) {
					return p;
				}

				let updated = { ...p, [ key ]: value } as SpacingSize;

				// Keep the stored `size` string in sync for presets authored
				// as a `clamp()`, so the CSS variable stays fluid.
				if ( isClampValue && key === 'fluid' ) {
					if ( value && typeof value === 'object' ) {
						const fluid = value as FluidSpacingConfig;
						updated = {
							...updated,
							size: generateClampValue(
								fluid.min as string | undefined,
								fluid.preferred as string | undefined,
								fluid.max as string | undefined
							),
						};
					} else if ( value === false ) {
						// Disabling fluid collapses the clamp to its minimum.
						updated = {
							...updated,
							size: clampValues.min ?? updated.size,
							fluid: false,
						};
					} else if ( value === true ) {
						updated = {
							...updated,
							size: generateClampValue(
								clampValues.min,
								clampValues.preferred,
								clampValues.max
							),
							fluid: true,
						};
					}
				}

				return updated;
			} )
		);

	const handleCustomFluidValues = ( value: boolean ) => {
		if ( value ) {
			// Seed the custom values from the size currently in use.
			set( 'fluid', {
				min: spacingSize.size,
				preferred: spacingSize.size,
				max: spacingSize.size,
			} );
		} else {
			set( 'fluid', true );
		}
	};

	const setFluidPart = (
		part: keyof FluidSpacingConfig,
		value: string | undefined
	) => {
		const fluid: FluidSpacingConfig =
			typeof spacingSize.fluid === 'object' ? spacingSize.fluid : {};
		set( 'fluid', { ...fluid, [ part ]: value } );
	};

	const menuItems: PresetEditHeaderMenuItem[] =
		origin === 'custom'
			? [
					{
						label: __( 'Rename' ),
						onClick: () => setIsRenameOpen( true ),
					},
					{
						label: __( 'Delete' ),
						onClick: () => setIsDeleteOpen( true ),
					},
			  ]
			: [];

	return (
		<>
			<Stack direction="column" gap="md">
				<PresetEditHeader
					title={ spacingSize.name }
					description={ sprintf(
						/* translators: %s: spacing size preset name. */
						__( 'Manage the spacing size %s.' ),
						spacingSize.name
					) }
					menuLabel={ __( 'Spacing size options' ) }
					menuItems={ menuItems }
				/>
				<View>
					<Spacer
						paddingX={ 4 }
						marginBottom={ 0 }
						paddingBottom={ 6 }
					>
						<Stack direction="column" gap="md">
							<FlexItem>
								<SpacingPreview spacingSize={ spacingSize } />
							</FlexItem>
							<SizeControl
								label={ __( 'Size' ) }
								value={
									! isCustomFluid
										? ( spacingSize.size as string )
										: ''
								}
								onChange={ ( value ) => set( 'size', value ) }
								disabled={ isCustomFluid }
								max={ 500 }
							/>
							<ToggleControl
								label={ __( 'Fluid spacing' ) }
								help={ __(
									'Scale the spacing size dynamically to fit the screen or viewport.'
								) }
								checked={ isFluid }
								onChange={ ( value ) => set( 'fluid', value ) }
							/>
							{ isFluid && (
								<ToggleControl
									label={ __( 'Custom fluid values' ) }
									help={ __(
										'Set custom min, preferred, and max values for the fluid spacing size.'
									) }
									checked={ isCustomFluid }
									onChange={ handleCustomFluidValues }
								/>
							) }
							{ isFluid &&
								isCustomFluid &&
								typeof spacingSize.fluid === 'object' && (
									<>
										<SizeControl
											label={ __( 'Minimum' ) }
											value={
												spacingSize.fluid.min as string
											}
											onChange={ ( value ) =>
												setFluidPart( 'min', value )
											}
											max={ 500 }
										/>
										<SizeControl
											label={ __( 'Preferred' ) }
											value={
												spacingSize.fluid
													.preferred as string
											}
											onChange={ ( value ) =>
												setFluidPart(
													'preferred',
													value
												)
											}
											max={ 500 }
										/>
										<SizeControl
											label={ __( 'Maximum' ) }
											value={
												spacingSize.fluid.max as string
											}
											onChange={ ( value ) =>
												setFluidPart( 'max', value )
											}
											max={ 500 }
										/>
									</>
								) }
						</Stack>
					</Spacer>
				</View>
			</Stack>
			{ isDeleteOpen && (
				<ConfirmDeleteDialog
					message={ sprintf(
						/* translators: %s: Name of the spacing size preset. */
						__(
							'Are you sure you want to delete "%s" spacing size preset?'
						),
						spacingSize.name
					) }
					isOpen={ isDeleteOpen }
					toggleOpen={ () => setIsDeleteOpen( false ) }
					onConfirm={ () => {
						setPresets(
							presets.filter( ( p ) => p.slug !== slug )
						);
						goBack();
					} }
				/>
			) }
			{ isRenameOpen && (
				<RenameDialog
					initialName={ spacingSize.name }
					placeholder={ __( 'Spacing size preset name' ) }
					toggleOpen={ () => setIsRenameOpen( false ) }
					onRename={ ( name ) =>
						setPresets(
							presets.map( ( p ) =>
								p.slug === slug ? { ...p, name } : p
							)
						)
					}
				/>
			) }
		</>
	);
}

export default Spacing;
