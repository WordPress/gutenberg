/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	InspectorControls,
	BlockControls,
	__experimentalBlockAlignmentMatrixControl as BlockAlignmentMatrixControl,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	ToolbarButton,
	ToolbarGroup,
	PanelBody,
	__experimentalNumberControl as NumberControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

export function Toolbar( {
	openDialog,
	closeDialog,
	isOpen,
	clientId,
	attributes,
} ) {
	const { dialogPosition } = attributes || {};
	/**
	 * Setup the icon and label for the block toolbar.
	 */
	const { selectBlock, updateBlockAttributes } =
		useDispatch( blockEditorStore );
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
				<BlockAlignmentMatrixControl
					label={ __( 'Change dialog position' ) }
					value={ dialogPosition }
					onChange={ ( nextPosition ) => {
						updateBlockAttributes( clientId, {
							dialogPosition: nextPosition,
						} );
					} }
				/>
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
		animationDuration = 500,
		animation = 'fade',
		dialogSize = 'medium',
		customBackdropColor,
		enableDeepLink = false,
	} = attributes || {};
	/**
	 * Setup the icon and label for the block toolbar.
	 */
	const { backdropColor, setBackdropColor } = colors;
	const colorSettings = useMultipleOriginColorsAndGradients();

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Dialog Settings' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label="Size"
						help="Choose the size of the dialog."
						value={ dialogSize }
						options={ [
							{
								label: __( 'Small' ),
								value: 'small',
							},
							{
								label: __( 'Medium' ),
								value: 'medium',
							},
							{
								label: __( 'Large' ),
								value: 'large',
							},
						] }
						onChange={ ( newSize ) => {
							setAttributes( {
								dialogSize: newSize,
							} );
						} }
					/>
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
				<PanelBody title={ __( 'Animation' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label="Dialog Animation"
						help="Choose the animation style for the dialog."
						value={ animation }
						options={ [
							{
								label: __( 'Fade' ),
								value: 'fade',
							},
							{
								label: __( 'Pop' ),
								value: 'pop',
							},
							{
								label: __( 'Bounce' ),
								value: 'bounce',
							},
							{
								label: __( 'Slide Down' ),
								value: 'slide',
							},
							{
								label: __( 'Slide Up' ),
								value: 'slide-up',
							},
							{
								label: __( 'Slide Left' ),
								value: 'slide-left',
							},
							{
								label: __( 'Slide Right' ),
								value: 'slide-right',
							},
							{
								label: __( 'Zoom' ),
								value: 'zoom',
							},
						] }
						onChange={ ( newAnimation ) => {
							setAttributes( {
								animation: newAnimation,
							} );
						} }
					/>
					<NumberControl
						__next40pxDefaultSize
						label="Animation Duration"
						help="The duration of the dialog animation in milliseconds."
						isShiftStepEnabled
						onChange={ ( newDuration ) =>
							setAttributes( {
								animationDuration: newDuration,
							} )
						}
						shiftStep={ 100 }
						value={ animationDuration }
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
