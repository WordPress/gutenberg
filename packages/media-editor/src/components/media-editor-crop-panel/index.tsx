/**
 * WordPress dependencies
 */
import {
	RangeControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { Stack, VisuallyHidden } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useCropper } from '../../image-editor';
import { useCropGestureHandlers } from '../../hooks/use-crop-gesture-handlers';
import { MAX_ZOOM } from '../../image-editor/core/constants';
import { getMinZoom } from '../../image-editor/core/containment';
import type { AspectRatioPreset } from '../../image-editor/core/constants';

export interface MediaEditorCropPanelProps {
	/**
	 * Selected aspect-ratio preset value as a string (so it round-trips
	 * through `<SelectControl>`). `'0'` = free, `'-1'` = original, any
	 * positive number = fixed ratio.
	 */
	aspectRatioValue: string;
	/** Setter for the aspect-ratio preset value. */
	onAspectRatioChange: ( value: string ) => void;
	/** Whether the cropper is in freeform (resize-handle) mode. */
	freeformCrop: boolean;
	/** Setter for freeform mode. */
	onFreeformChange: ( value: boolean ) => void;
	/** Signal that a placement-oriented control is being adjusted. */
	onPlacementControlInteraction?: () => void;
	/** Aspect-ratio presets to display in the selector. */
	aspectRatioOptions: AspectRatioPreset[];
}

/**
 * Sidebar panel for crop-shape controls — aspect-ratio presets and
 * freeform toggle. The tactile verbs (rotate, flip) live in the
 * bottom toolbar instead.
 * @param props
 * @param props.aspectRatioValue
 * @param props.onAspectRatioChange
 * @param props.freeformCrop
 * @param props.onFreeformChange
 * @param props.onPlacementControlInteraction
 * @param props.aspectRatioOptions
 */
export default function MediaEditorCropPanel( {
	aspectRatioValue,
	onAspectRatioChange,
	freeformCrop,
	onFreeformChange,
	onPlacementControlInteraction,
	aspectRatioOptions,
}: MediaEditorCropPanelProps ) {
	const { state, setZoom } = useCropper();
	const zoomGestureHandlers = useCropGestureHandlers();
	const minZoom = getMinZoom( state );

	return (
		<Stack direction="column" gap="md">
			<VisuallyHidden render={ <h2 /> }>
				{ __( 'Crop options' ) }
			</VisuallyHidden>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Aspect ratio' ) }
				value={ aspectRatioValue }
				onChange={ onAspectRatioChange }
				options={ aspectRatioOptions.map( ( preset ) => ( {
					label: preset.label,
					value: preset.value.toString(),
				} ) ) }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Resize crop area' ) }
				help={ __( 'Show handles to adjust the crop box.' ) }
				checked={ freeformCrop }
				onChange={ onFreeformChange }
			/>
			<div role="presentation" { ...zoomGestureHandlers }>
				<RangeControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Zoom' ) }
					min={ minZoom }
					max={ MAX_ZOOM }
					step={ 0.1 }
					value={ state.zoom }
					onChange={ ( value ) => {
						onPlacementControlInteraction?.();
						setZoom( typeof value === 'number' ? value : minZoom );
					} }
					renderTooltipContent={ ( value ) => {
						const zoom =
							typeof value === 'number' ? value : minZoom;
						return sprintf(
							/* translators: %d: zoom level as a percentage. */
							__( '%d%%' ),
							Math.round( zoom * 100 )
						);
					} }
				/>
			</div>
		</Stack>
	);
}
