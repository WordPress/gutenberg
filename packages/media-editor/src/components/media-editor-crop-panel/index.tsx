import { SelectControl, Stack, VisuallyHidden } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { Icon, getAspectRatioIcon } from '@wordpress/icons';
import type { AspectRatioPreset } from '../../state/aspect-ratio-presets';
import { CROP_CONTROL_ATTR } from '../../hooks/use-crop-gesture-handlers';
import MediaEditorImageControls from '../media-editor-image-controls';

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
	/** Disable every control in the panel while the edit is saving. */
	disabled?: boolean;
}

/**
 * Sidebar panel for crop controls: rotate, flip and zoom above the
 * aspect-ratio selector. Rendered where the panel docks; below that the
 * transform controls sit under the canvas instead, placed by the editor.
 * @param props
 * @param props.aspectRatioValue
 * @param props.onAspectRatioChange
 * @param props.aspectRatioOptions
 * @param props.disabled
 */
export default function MediaEditorCropPanel( {
	aspectRatioValue,
	onAspectRatioChange,
	aspectRatioOptions,
	disabled = false,
}: MediaEditorCropPanelProps ) {
	const items = aspectRatioOptions.map( ( preset ) => ( {
		label: preset.label,
		value: preset.value.toString(),
	} ) );

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
			<MediaEditorImageControls withLabels disabled={ disabled } />
			<SelectControl
				label={ __( 'Aspect ratio' ) }
				value={
					items.find( ( item ) => item.value === aspectRatioValue ) ??
					null
				}
				onValueChange={ ( item ) => {
					if ( item && item.value !== null ) {
						onAspectRatioChange( item.value );
					}
				} }
				disabled={ disabled }
				items={ items }
				trigger={
					<SelectControl.Trigger>
						{ ( item ) => (
							<span className="media-editor-crop-panel__aspect-ratio-option">
								<Icon
									icon={ getAspectRatioIcon(
										Number( item.value )
									) }
								/>
								<span className="media-editor-crop-panel__aspect-ratio-label">
									{ item.label }
								</span>
							</span>
						) }
					</SelectControl.Trigger>
				}
			>
				{ items.map( ( item ) => (
					<SelectControl.Item
						key={ item.value }
						value={ item }
						label={ item.label }
					>
						<SelectControl.ItemLabel>
							<span className="media-editor-crop-panel__aspect-ratio-option">
								<Icon
									icon={ getAspectRatioIcon(
										Number( item.value )
									) }
								/>
								{ item.label }
							</span>
						</SelectControl.ItemLabel>
					</SelectControl.Item>
				) ) }
			</SelectControl>
		</Stack>
	);
}
