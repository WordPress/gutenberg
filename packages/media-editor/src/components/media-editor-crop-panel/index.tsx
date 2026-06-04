/**
 * WordPress dependencies
 */
import { RangeControl, SelectControl } from '@wordpress/components';
import { Stack, VisuallyHidden } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useMediaEditor } from '../../state';
import {
	useCropGestureHandlers,
	CROP_CONTROL_ATTR,
} from '../../hooks/use-crop-gesture-handlers';
import { MAX_ZOOM } from '../../image-editor/core/constants';
import { getMinZoom } from '../../image-editor/core/containment';
import type { AspectRatioPreset } from '../../image-editor/core/constants';

const ZOOM_PERCENTAGE_SCALE = 100;
const MAX_ZOOM_PERCENTAGE = MAX_ZOOM * ZOOM_PERCENTAGE_SCALE;

function getZoomPercentageForDisplay( zoom: number ): number {
	return Math.round( zoom * ZOOM_PERCENTAGE_SCALE );
}

function getMinZoomPercentageForDisplay( zoom: number ): number {
	return Math.ceil( zoom * ZOOM_PERCENTAGE_SCALE );
}

export interface MediaEditorCropPanelProps {
	/**
	 * Selected aspect-ratio preset value as a string (so it round-trips
	 * through `<SelectControl>`). `'0'` = free, `'-1'` = original, any
	 * positive number = fixed ratio.
	 */
	aspectRatioValue: string;
	/** Setter for the aspect-ratio preset value. */
	onAspectRatioChange: ( value: string ) => void;
	/** Signal that a placement-oriented control is being adjusted. */
	onPlacementControlInteraction?: () => void;
	/** Aspect-ratio presets to display in the selector. */
	aspectRatioOptions: AspectRatioPreset[];
}

/**
 * Sidebar panel for crop-shape controls. The tactile verbs (rotate, flip)
 * live in the bottom toolbar instead.
 * @param props
 * @param props.aspectRatioValue
 * @param props.onAspectRatioChange
 * @param props.onPlacementControlInteraction
 * @param props.aspectRatioOptions
 */
export default function MediaEditorCropPanel( {
	aspectRatioValue,
	onAspectRatioChange,
	onPlacementControlInteraction,
	aspectRatioOptions,
}: MediaEditorCropPanelProps ) {
	const { state, setZoom } = useMediaEditor();
	const zoomGestureHandlers = useCropGestureHandlers();
	const minZoom = getMinZoom( state );
	const zoomPercentage = getZoomPercentageForDisplay( state.zoom );
	const minZoomPercentage = getMinZoomPercentageForDisplay( minZoom );

	return (
		// Tag the whole panel as a crop-control region so the modal's
		// Cmd+Z handler doesn't mistake the SelectControl input for a
		// metadata field (which would suppress undo).
		<Stack
			direction="column"
			gap="xl"
			{ ...{ [ CROP_CONTROL_ATTR ]: true } }
		>
			<VisuallyHidden render={ <h2 /> }>
				{ __( 'Crop options' ) }
			</VisuallyHidden>
			<SelectControl
				__next40pxDefaultSize
				label={ __( 'Aspect ratio' ) }
				value={ aspectRatioValue }
				onChange={ onAspectRatioChange }
				options={ aspectRatioOptions.map( ( preset ) => ( {
					label: preset.label,
					value: preset.value.toString(),
				} ) ) }
			/>
			<div role="presentation" { ...zoomGestureHandlers }>
				<RangeControl
					__next40pxDefaultSize
					label={ __( 'Zoom (%)' ) }
					min={ minZoomPercentage }
					max={ MAX_ZOOM_PERCENTAGE }
					step={ 1 }
					shiftStep={ 10 }
					value={ zoomPercentage }
					onChange={ ( value ) => {
						onPlacementControlInteraction?.();
						setZoom(
							typeof value === 'number'
								? value / ZOOM_PERCENTAGE_SCALE
								: minZoom
						);
					} }
					renderTooltipContent={ ( value ) => {
						const percentage =
							typeof value === 'number'
								? value
								: minZoomPercentage;
						return sprintf(
							/* translators: %d: zoom level as a percentage. */
							__( '%d%%' ),
							Math.round( percentage )
						);
					} }
				/>
			</div>
		</Stack>
	);
}
