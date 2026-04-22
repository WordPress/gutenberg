/**
 * WordPress dependencies
 */
import { SelectControl, ToggleControl } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	DEFAULT_ASPECT_RATIOS,
	ORIGINAL_ASPECT_RATIO,
} from '../../image-editor/core/constants';

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
 */
export default function MediaEditorCropPanel( {
	aspectRatioValue,
	onAspectRatioChange,
	freeformCrop,
	onFreeformChange,
}: MediaEditorCropPanelProps ) {
	return (
		<Stack direction="column" gap="md">
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Aspect ratio' ) }
				value={ aspectRatioValue }
				onChange={ onAspectRatioChange }
				options={ DEFAULT_ASPECT_RATIOS.map( ( preset ) => ( {
					label: preset.label,
					value: preset.value.toString(),
				} ) ) }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Freeform crop' ) }
				help={ __(
					'Drag the crop edges to resize freely. When off, the crop is fixed to the selected ratio.'
				) }
				checked={ freeformCrop }
				onChange={ onFreeformChange }
			/>
		</Stack>
	);
}
