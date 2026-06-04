/**
 * WordPress dependencies
 */
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	aspectRatio as aspectRatioIcon,
	check,
	rotateLeft,
	rotateRight,
	flipHorizontal,
	flipVertical,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useMediaEditor } from '../../state';
import type { AspectRatioPreset } from '../../image-editor/core/constants';
import { useCropOptions } from '../media-editor/use-crop-options';

export interface MediaEditorImageControlsProps {
	/**
	 * When `true`, render rotate and flip as two labelled groups stacked
	 * vertically — the Crop panel layout used on wide viewports. When
	 * `false` (default), render a single flat row of icon buttons — the
	 * footer layout used at narrower widths.
	 */
	withLabels?: boolean;
	/**
	 * When `true`, include an aspect-ratio dropdown in the flat toolbar.
	 * Omitted from the labelled panel layout because the Crop panel already
	 * renders the full aspect-ratio select control.
	 */
	showAspectRatioControl?: boolean;
	/** Optional caller-supplied aspect-ratio presets. */
	aspectRatioPresets?: AspectRatioPreset[];
}

/**
 * Image editing controls that can be placed independently per viewport: on
 * wide viewports rotate/flip render inside the Crop panel (`withLabels`), and
 * at narrower widths they fall back into the footer toolbar (flat row), where
 * the aspect-ratio dropdown can also be shown.
 *
 * @param props
 * @param props.withLabels
 * @param props.showAspectRatioControl
 * @param props.aspectRatioPresets
 */
export default function MediaEditorImageControls( {
	withLabels = false,
	showAspectRatioControl = false,
	aspectRatioPresets,
}: MediaEditorImageControlsProps ) {
	const { state, setFlip, snapRotate90 } = useMediaEditor();
	const { aspectRatioValue, setAspectRatioValue, aspectRatioOptions } =
		useCropOptions( { aspectRatioPresets } );
	const hasAspectRatioControl = ! withLabels && showAspectRatioControl;

	const rotateButtons = (
		<>
			<Button
				size="compact"
				icon={ rotateLeft }
				label={ __( 'Rotate 90° counter-clockwise' ) }
				showTooltip
				onClick={ () => snapRotate90( -1 ) }
			/>
			<Button
				size="compact"
				icon={ rotateRight }
				label={ __( 'Rotate 90° clockwise' ) }
				showTooltip
				onClick={ () => snapRotate90( 1 ) }
			/>
		</>
	);

	const flipButtons = (
		<>
			<Button
				size="compact"
				icon={ flipHorizontal }
				label={ __( 'Flip horizontal' ) }
				showTooltip
				isPressed={ state.flip.horizontal }
				onClick={ () =>
					setFlip( {
						horizontal: ! state.flip.horizontal,
						vertical: state.flip.vertical,
					} )
				}
			/>
			<Button
				size="compact"
				icon={ flipVertical }
				label={ __( 'Flip vertical' ) }
				showTooltip
				isPressed={ state.flip.vertical }
				onClick={ () =>
					setFlip( {
						horizontal: state.flip.horizontal,
						vertical: ! state.flip.vertical,
					} )
				}
			/>
		</>
	);

	const aspectRatioDropdown = hasAspectRatioControl ? (
		<DropdownMenu
			icon={ aspectRatioIcon }
			label={ __( 'Aspect ratio' ) }
			popoverProps={ { placement: 'top' } }
			toggleProps={ { size: 'compact' } }
		>
			{ ( { onClose } ) => (
				<MenuGroup label={ __( 'Aspect ratio' ) }>
					{ aspectRatioOptions.map( ( preset ) => {
						const value = preset.value.toString();
						const isSelected = value === aspectRatioValue;
						return (
							<MenuItem
								key={ value }
								role="menuitemradio"
								isSelected={ isSelected }
								icon={ isSelected ? check : undefined }
								onClick={ () => {
									setAspectRatioValue( value );
									onClose();
								} }
							>
								{ preset.label }
							</MenuItem>
						);
					} ) }
				</MenuGroup>
			) }
		</DropdownMenu>
	) : null;

	if ( withLabels ) {
		return (
			<div className="media-editor-image-controls is-stacked">
				<div
					className="media-editor-image-controls__group"
					role="group"
					aria-label={ __( 'Rotate' ) }
				>
					<span
						className="media-editor-image-controls__label"
						aria-hidden="true"
					>
						{ __( 'Rotate' ) }
					</span>
					<div className="media-editor-image-controls__buttons">
						{ rotateButtons }
					</div>
				</div>
				<div
					className="media-editor-image-controls__group"
					role="group"
					aria-label={ __( 'Flip' ) }
				>
					<span
						className="media-editor-image-controls__label"
						aria-hidden="true"
					>
						{ __( 'Flip' ) }
					</span>
					<div className="media-editor-image-controls__buttons">
						{ flipButtons }
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="media-editor-image-controls">
			{ rotateButtons }
			{ flipButtons }
			{ aspectRatioDropdown }
		</div>
	);
}
