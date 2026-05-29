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

/**
 * Snap-rotate and flip controls for the media-editor footer. Rotation and
 * reflection are both geometric transforms, hence "transform controls".
 * Lives separately from the fine-rotation slider so the footer can place
 * the two halves on different rows at intermediate viewport widths.
 */
export default function MediaEditorTransformControls() {
	const { state, setFlip, snapRotate90 } = useMediaEditor();
	return (
		<div className="media-editor-transform-controls">
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
		</div>
	);
}
