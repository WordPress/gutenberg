/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { Stack, VisuallyHidden } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
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
	/**
	 * When `true`, render the rotate/flip/zoom image controls at the top of
	 * the panel. Used on wide viewports where the footer no longer carries
	 * them.
	 */
	showTransformControls?: boolean;
}

/**
 * Sidebar panel for crop controls. Renders the aspect-ratio selector, plus the
 * rotate/flip and zoom controls on wide viewports (these move to the footer
 * toolbar when the sidebar collapses).
 * @param props
 * @param props.aspectRatioValue
 * @param props.onAspectRatioChange
 * @param props.aspectRatioOptions
 * @param props.showTransformControls
 */
export default function MediaEditorCropPanel( {
	aspectRatioValue,
	onAspectRatioChange,
	aspectRatioOptions,
	showTransformControls = false,
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
			{ showTransformControls && <MediaEditorImageControls withLabels /> }
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
		</Stack>
	);
}
