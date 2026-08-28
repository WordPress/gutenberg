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
	FontSize as FontSizeType,
	FluidTypographySettings,
	FluidTypographyConfig,
} from '@wordpress/global-styles-engine';
import { Stack } from '@wordpress/ui';
import FontSizePreview from './font-size-preview';
import { SizeControl } from '../size-control';
import { usePresets } from '../presets/use-presets';
import { useSetting } from '../hooks';
import PresetEditHeader from '../presets/preset-edit-header';
import type { PresetEditHeaderMenuItem } from '../presets/preset-edit-header';
import ConfirmDeleteDialog from '../presets/dialogs/confirm-delete-dialog';
import RenameDialog from '../presets/dialogs/rename-dialog';

function FontSize() {
	const { params, goBack } = useNavigator();
	const origin = params.origin as string;
	const slug = params.slug as string;

	const { presets, setPresets } = usePresets< FontSizeType >(
		'typography.fontSizes',
		origin
	);
	const [ globalFluid ] = useSetting<
		boolean | FluidTypographySettings | undefined
	>( 'typography.fluid' );

	const fontSize = presets.find( ( s ) => s.slug === slug );

	const [ isDeleteOpen, setIsDeleteOpen ] = useState( false );
	const [ isRenameOpen, setIsRenameOpen ] = useState( false );

	// The preset can disappear while its screen is open, e.g. when presets are
	// reset globally. Navigate back to the font sizes list in that case.
	useEffect( () => {
		if ( !! slug && ! fontSize ) {
			goBack();
		}
	}, [ slug, fontSize, goBack ] );

	if ( ! origin || ! slug || ! fontSize ) {
		return null;
	}

	const isFluid =
		fontSize.fluid !== undefined ? !! fontSize.fluid : !! globalFluid;
	const isCustomFluid = typeof fontSize.fluid === 'object';

	const set = ( key: keyof FontSizeType, value: unknown ) =>
		setPresets(
			presets.map( ( p ) =>
				p.slug === slug
					? ( { ...fontSize, [ key ]: value } as FontSizeType )
					: p
			)
		);

	const handleCustomFluidValues = ( value: boolean ) => {
		if ( value ) {
			set( 'fluid', { min: fontSize.size, max: fontSize.size } );
		} else {
			set( 'fluid', true );
		}
	};
	const handleMinChange = ( value: string | undefined ) => {
		const fluid: FluidTypographyConfig =
			typeof fontSize.fluid === 'object' ? fontSize.fluid : {};
		set( 'fluid', { ...fluid, min: value } );
	};
	const handleMaxChange = ( value: string | undefined ) => {
		const fluid: FluidTypographyConfig =
			typeof fontSize.fluid === 'object' ? fontSize.fluid : {};
		set( 'fluid', { ...fluid, max: value } );
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
					title={ fontSize.name }
					description={ sprintf(
						/* translators: %s: font size preset name. */
						__( 'Manage the font size %s.' ),
						fontSize.name
					) }
					menuLabel={ __( 'Font size options' ) }
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
								<FontSizePreview fontSize={ fontSize } />
							</FlexItem>
							<SizeControl
								label={ __( 'Size' ) }
								value={
									! isCustomFluid && fontSize.size
										? String( fontSize.size )
										: ''
								}
								onChange={ ( value ) => set( 'size', value ) }
								disabled={ isCustomFluid }
							/>
							<ToggleControl
								label={ __( 'Fluid typography' ) }
								help={ __(
									'Scale the font size dynamically to fit the screen or viewport.'
								) }
								checked={ isFluid }
								onChange={ ( value ) => set( 'fluid', value ) }
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
											typeof fontSize.fluid === 'object'
												? fontSize.fluid?.min
												: undefined
										}
										onChange={ handleMinChange }
									/>
									<SizeControl
										label={ __( 'Maximum' ) }
										value={
											typeof fontSize.fluid === 'object'
												? fontSize.fluid?.max
												: undefined
										}
										onChange={ handleMaxChange }
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
						/* translators: %s: Name of the font size preset. */
						__(
							'Are you sure you want to delete "%s" font size preset?'
						),
						fontSize.name
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
					initialName={ fontSize.name }
					placeholder={ __( 'Font size preset name' ) }
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

export default FontSize;
