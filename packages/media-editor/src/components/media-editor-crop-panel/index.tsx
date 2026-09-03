import { SelectControl } from '@wordpress/components';
import { Stack, VisuallyHidden } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { CROP_CONTROL_ATTR } from '../../hooks/use-crop-gesture-handlers';
import MediaEditorImageControls from '../media-editor-image-controls';
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
	/** Aspect-ratio presets to display in the selector. */
	aspectRatioOptions: AspectRatioPreset[];
}

/**
 * Sidebar panel for crop controls: rotate, flip and zoom above the
 * aspect-ratio selector. Rendered where the panel docks; below that the
 * transform controls sit under the canvas instead, placed by the editor.
 * @param props
 * @param props.aspectRatioValue
 * @param props.onAspectRatioChange
 * @param props.aspectRatioOptions
 */
export default function MediaEditorCropPanel( {
	aspectRatioValue,
	onAspectRatioChange,
	aspectRatioOptions,
}: MediaEditorCropPanelProps ) {
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
			<MediaEditorImageControls withLabels />
			<SelectControl
				label={ __( 'Aspect ratio' ) }
				value={ aspectRatioValue }
				onChange={ onAspectRatioChange }
				options={ aspectRatioOptions.map( ( preset ) => ( {
					label: preset.label,
					value: preset.value.toString(),
				} ) ) }
			/>
		</Stack>
	);
}
