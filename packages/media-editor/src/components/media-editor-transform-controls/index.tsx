/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	rotateLeft,
	rotateRight,
	flipHorizontal,
	flipVertical,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useMediaEditor } from '../../state';

export interface MediaEditorTransformControlsProps {
	/**
	 * When `true`, render rotate and flip as two labelled groups stacked
	 * vertically — the Crop panel layout used on wide viewports. When
	 * `false` (default), render a single flat row of icon buttons — the
	 * footer layout used at narrower widths.
	 */
	withLabels?: boolean;
}

/**
 * Snap-rotate and flip controls. Rotation and reflection are both geometric
 * transforms, hence "transform controls". Lives separately from the
 * fine-rotation slider so each can be placed independently per viewport: on
 * wide viewports both render inside the Crop panel (`withLabels`), and at
 * narrower widths they fall back into the footer toolbar (flat row).
 *
 * @param props
 * @param props.withLabels
 */
export default function MediaEditorTransformControls( {
	withLabels = false,
}: MediaEditorTransformControlsProps ) {
	const { state, setFlip, snapRotate90 } = useMediaEditor();

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

	if ( withLabels ) {
		return (
			<div className="media-editor-transform-controls is-stacked">
				<div
					className="media-editor-transform-controls__group"
					role="group"
					aria-label={ __( 'Rotate' ) }
				>
					<span
						className="media-editor-transform-controls__label"
						aria-hidden="true"
					>
						{ __( 'Rotate' ) }
					</span>
					<div className="media-editor-transform-controls__buttons">
						{ rotateButtons }
					</div>
				</div>
				<div
					className="media-editor-transform-controls__group"
					role="group"
					aria-label={ __( 'Flip' ) }
				>
					<span
						className="media-editor-transform-controls__label"
						aria-hidden="true"
					>
						{ __( 'Flip' ) }
					</span>
					<div className="media-editor-transform-controls__buttons">
						{ flipButtons }
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="media-editor-transform-controls">
			{ rotateButtons }
			{ flipButtons }
		</div>
	);
}
