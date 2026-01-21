/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	Button,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useImageCropper } from '@wordpress/image-cropper';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ZoomControl from './zoom-control';
import AspectRatioControl from './aspect-ratio-control';
import RotationControl from './rotation-control';
import FlipControl from './flip-control';

/**
 * CroppingPanel component provides a tools panel with cropping controls.
 * Uses ToolsPanel for consistent WordPress UI patterns.
 * Split into two panels: Crop Area (zoom, aspect ratio) and Position (rotate, flip).
 */
export default function CroppingPanel() {
	const { cropperState, setCropperState, reset, resetState } =
		useImageCropper();

	const resetCropArea = useCallback( () => {
		setCropperState( {
			zoom: resetState?.zoom ?? 1,
			aspectRatio: resetState?.aspectRatio ?? 1,
		} );
	}, [ setCropperState, resetState ] );

	const resetPosition = useCallback( () => {
		setCropperState( {
			flip: resetState?.flip ?? {
				horizontal: false,
				vertical: false,
			},
			rotation: resetState?.rotation ?? 0,
		} );
	}, [ setCropperState, resetState ] );

	return (
		<div className="media-editor-cropping-panel">
			<ToolsPanel
				label={ __( 'Crop area' ) }
				resetAll={ resetCropArea }
				className="media-editor-cropping-panel__tools"
				panelId="crop-area"
			>
				<ToolsPanelItem
					hasValue={ () =>
						cropperState.zoom !== ( resetState?.zoom ?? 1 )
					}
					label={ __( 'Zoom' ) }
					onDeselect={ () =>
						setCropperState( { zoom: resetState?.zoom ?? 1 } )
					}
					isShownByDefault
					panelId="crop-area"
				>
					<ZoomControl />
				</ToolsPanelItem>

				<ToolsPanelItem
					hasValue={ () =>
						cropperState.aspectRatio !==
						( resetState?.aspectRatio ?? 1 )
					}
					label={ __( 'Aspect Ratio' ) }
					onDeselect={ () =>
						setCropperState( {
							aspectRatio: resetState?.aspectRatio ?? 1,
						} )
					}
					isShownByDefault
					panelId="crop-area"
				>
					<AspectRatioControl />
				</ToolsPanelItem>
			</ToolsPanel>

			<ToolsPanel
				label={ __( 'Position' ) }
				resetAll={ resetPosition }
				className="media-editor-cropping-panel__tools"
				panelId="position"
			>
				<ToolsPanelItem
					hasValue={ () =>
						cropperState.rotation !== ( resetState?.rotation ?? 0 )
					}
					label={ __( 'Rotate' ) }
					onDeselect={ () =>
						setCropperState( {
							rotation: resetState?.rotation ?? 0,
						} )
					}
					isShownByDefault
					panelId="position"
				>
					<RotationControl />
				</ToolsPanelItem>

				<ToolsPanelItem
					hasValue={ () => {
						const defaultFlip = {
							horizontal: false,
							vertical: false,
						};
						const resetFlip = resetState?.flip ?? defaultFlip;
						return (
							cropperState.flip.horizontal !==
								resetFlip.horizontal ||
							cropperState.flip.vertical !== resetFlip.vertical
						);
					} }
					label={ __( 'Flip' ) }
					onDeselect={ () =>
						setCropperState( {
							flip: resetState?.flip ?? {
								horizontal: false,
								vertical: false,
							},
						} )
					}
					isShownByDefault
					panelId="position"
				>
					<FlipControl />
				</ToolsPanelItem>
			</ToolsPanel>

			<HStack
				justify="flex-end"
				className="media-editor-cropping-panel__reset"
			>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					isDestructive
					onClick={ reset }
				>
					{ __( 'Reset all' ) }
				</Button>
			</HStack>
		</div>
	);
}
