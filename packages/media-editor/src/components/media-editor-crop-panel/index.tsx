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
import {
	DEFAULT_ASPECT_RATIOS,
	MAX_ZOOM,
	MIN_ZOOM,
	ORIGINAL_ASPECT_RATIO,
} from '../../image-editor/core/constants';
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
	/**
	 * Fixed aspect-ratio presets to display after Free and Original. When
	 * omitted, the media editor's default fixed-ratio presets are used.
	 */
	aspectRatioPresets?: AspectRatioPreset[];
}

/**
 * Resolve an aspect-ratio preset value into a number suitable for
 * `<Cropper aspectRatio=...>`. Returns `undefined` for Free (no lock).
 *
 * @param value            Preset value as a string.
 * @param imageAspectRatio Image's natural width / height — used for
 *                         the Original preset.
 */
export function resolveAspectRatio(
	value: string,
	imageAspectRatio: number | null
): number | undefined {
	const num = parseFloat( value );
	if ( num === 0 ) {
		return undefined;
	}
	if ( num === ORIGINAL_ASPECT_RATIO && imageAspectRatio ) {
		return imageAspectRatio;
	}
	if ( num > 0 ) {
		return num;
	}
	return undefined;
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
 * @param props.aspectRatioPresets
 */
export default function MediaEditorCropPanel( {
	aspectRatioValue,
	onAspectRatioChange,
	freeformCrop,
	onFreeformChange,
	onPlacementControlInteraction,
	aspectRatioPresets,
}: MediaEditorCropPanelProps ) {
	const { state, setZoom } = useCropper();
	const zoomGestureHandlers = useCropGestureHandlers();
	const aspectRatioOptions = [
		...DEFAULT_ASPECT_RATIOS.filter( ( preset ) => preset.value <= 0 ),
		...( aspectRatioPresets ??
			DEFAULT_ASPECT_RATIOS.filter( ( preset ) => preset.value > 0 ) ),
	];
	const handleAspectRatioChange = ( value: string ) => {
		onAspectRatioChange( value );
		if ( value === '0' && ! freeformCrop ) {
			onFreeformChange( true );
		}
	};

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
				onChange={ handleAspectRatioChange }
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
					min={ MIN_ZOOM }
					max={ MAX_ZOOM }
					step={ 0.1 }
					value={ state.zoom }
					onChange={ ( value ) => {
						onPlacementControlInteraction?.();
						setZoom( typeof value === 'number' ? value : MIN_ZOOM );
					} }
					renderTooltipContent={ ( value ) => {
						const zoom =
							typeof value === 'number' ? value : MIN_ZOOM;
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
