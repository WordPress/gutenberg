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
		() => ( isOpen ? __( 'Close dialog' ) : __( 'Edit dialog' ) ),
		[ isOpen ]
	);

	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					label={ buttonLabel }
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
	const { customBackdropColor, enableDeepLink = false } = attributes || {};
	const { backdropColor, setBackdropColor } = colors;
	const colorSettings = useMultipleOriginColorsAndGradients();

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Enable deep linking' ) }
						help={ __(
							'Allow the dialog to be opened via its HTML Anchor (set in the Advanced panel).'
						) }
						checked={ enableDeepLink }
						onChange={ ( newEnableDeepLink ) =>
							setAttributes( {
								enableDeepLink: newEnableDeepLink,
							} )
						}
					/>
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
							enableAlpha: true,
							clearable: true,
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
