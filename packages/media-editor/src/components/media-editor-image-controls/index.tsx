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
	lineSolid,
	plus,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useMediaEditor } from '../../state';
import {
	MAX_ZOOM,
	type AspectRatioPreset,
} from '../../image-editor/core/constants';
import { getMinZoom } from '../../image-editor/core/containment';
import { useCropOptions } from '../media-editor/use-crop-options';

/**
 * Default zoom factor per +/- click. Zooming is geometric, so a fixed
 * multiplier — rather than an additive step — makes each click feel like the
 * same amount of zoom at any level (an additive `+0.1` is a 10% jump at 1× but
 * a ~1% nudge at 10×). `1.2` is ~+20% per click. Overridable via the
 * `zoomFactor` prop.
 */
export const DEFAULT_ZOOM_FACTOR = 1.2;

export interface MediaEditorImageControlsProps {
	/**
	 * When `true`, render rotate, flip and zoom as labelled groups — the Crop
	 * panel layout used on wide viewports. When `false` (default), render a
	 * single flat row of icon buttons — the footer layout used at narrower
	 * widths.
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
	/**
	 * Multiplier applied to the zoom per +/- click — zoom in multiplies by it,
	 * zoom out divides by it. Must be greater than 1. Defaults to
	 * `DEFAULT_ZOOM_FACTOR` (1.2).
	 */
	zoomFactor?: number;
}

/**
 * Image editing controls placed independently per viewport: on wide viewports
 * rotate/flip/zoom render inside the Crop panel (`withLabels`), and at narrower
 * widths they fall back into the footer toolbar (flat row), where the
 * aspect-ratio dropdown can also be shown.
 *
 * @param props
 * @param props.withLabels
 * @param props.showAspectRatioControl
 * @param props.aspectRatioPresets
 * @param props.zoomFactor
 */
export default function MediaEditorImageControls( {
	withLabels = false,
	showAspectRatioControl = false,
	aspectRatioPresets,
	zoomFactor = DEFAULT_ZOOM_FACTOR,
}: MediaEditorImageControlsProps ) {
	const { state, setFlip, snapRotate90, setZoom } = useMediaEditor();
	const { aspectRatioValue, setAspectRatioValue, aspectRatioOptions } =
		useCropOptions( { aspectRatioPresets } );
	const hasAspectRatioControl = ! withLabels && showAspectRatioControl;
	const minZoom = getMinZoom( state );
	const zoomByFactor = ( factor: number ) => {
		setZoom(
			Math.min( MAX_ZOOM, Math.max( minZoom, state.zoom * factor ) )
		);
	};

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

	const zoomButtons = (
		<>
			<Button
				size="compact"
				icon={ plus }
				label={ __( 'Zoom in' ) }
				showTooltip
				disabled={ state.zoom >= MAX_ZOOM }
				accessibleWhenDisabled
				onClick={ () => zoomByFactor( zoomFactor ) }
			/>
			<Button
				size="compact"
				icon={ lineSolid }
				label={ __( 'Zoom out' ) }
				showTooltip
				disabled={ state.zoom <= minZoom }
				accessibleWhenDisabled
				onClick={ () => zoomByFactor( 1 / zoomFactor ) }
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
				<div className="media-editor-image-controls__transforms">
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
				<div
					className="media-editor-image-controls__group"
					role="group"
					aria-label={ __( 'Zoom' ) }
				>
					<span
						className="media-editor-image-controls__label"
						aria-hidden="true"
					>
						{ __( 'Zoom' ) }
					</span>
					<div className="media-editor-image-controls__buttons">
						{ zoomButtons }
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="media-editor-image-controls">
			{ rotateButtons }
			{ flipButtons }
			{ zoomButtons }
			{ aspectRatioDropdown }
		</div>
	);
}
