/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	InspectorControls,
	BlockControls,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	ToolbarButton,
	ToolbarGroup,
	PanelBody,
	__experimentalNumberControl as NumberControl,
	ToggleControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

export function Toolbar( { openDialog, closeDialog, isOpen, clientId } ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const { rootClientId } = useSelect(
		( select ) => {
			return {
				rootClientId:
					select( blockEditorStore ).getBlockRootClientId( clientId ),
			};
		},
		[ clientId ]
	);
	const buttonLabel = useMemo(
		() => ( isOpen ? __( 'Close Dialog' ) : __( 'Edit Dialog' ) ),
		[ isOpen ]
	);

	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					label={ buttonLabel }
					isActive={ isOpen }
					onClick={ () => {
						if ( isOpen ) {
							selectBlock( rootClientId );
							closeDialog();
						} else {
							openDialog();
						}
					} }
				>
					{ buttonLabel }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}

export function InspectorPanel( {
	colors,
	clientId,
	attributes,
	setAttributes,
} ) {
	const {
		autoActivationTimer = -1,
		customBackdropColor,
		enableDeepLink = false,
	} = attributes || {};
	const { backdropColor, setBackdropColor } = colors;
	const colorSettings = useMultipleOriginColorsAndGradients();

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Enable Deep Linking' ) }
						help={ __(
							'Allow the dialog to be opened via a URL hash (e.g., #dialog-id).'
						) }
						checked={ enableDeepLink }
						onChange={ ( newEnableDeepLink ) =>
							setAttributes( {
								enableDeepLink: newEnableDeepLink,
							} )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Auto Activation Timer' ) }
						help={ __(
							'Automatically open the dialog after the specified time, in milliseconds.'
						) }
						checked={ 1 <= autoActivationTimer }
						onChange={ ( newAutoActivationTimer ) =>
							setAttributes( {
								autoActivationTimer: newAutoActivationTimer
									? 5000
									: -1,
							} )
						}
					/>
					{ 1 <= autoActivationTimer && (
						<NumberControl
							__next40pxDefaultSize
							label="Activation Timer Duration"
							isShiftStepEnabled
							onChange={ ( newDuration ) =>
								setAttributes( {
									autoActivationTimer: newDuration,
								} )
							}
							shiftStep={ 100 }
							value={ autoActivationTimer }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="color">
				<ColorGradientSettingsDropdown
					settings={ [
						{
							label: __( 'Backdrop' ),
							colorValue:
								backdropColor?.color ?? customBackdropColor,
							onColorChange: ( value ) => {
								setBackdropColor( value );
								setAttributes( {
									customBackdropColor: value,
								} );
							},
						},
					] }
					panelId={ clientId }
					hasColorsOrGradients={ false }
					disableCustomColors={ false }
					__experimentalIsRenderedInSidebar
					{ ...colorSettings }
				/>
			</InspectorControls>
		</>
	);
}
