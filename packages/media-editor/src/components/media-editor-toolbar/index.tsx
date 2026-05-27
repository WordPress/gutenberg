/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
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
import { useCropGestureHandlers } from '../../hooks/use-crop-gesture-handlers';
import { MAX_ROTATION_OFFSET } from '../../image-editor/core/constants';
import RotationRuler from '../rotation-ruler';

export interface MediaEditorToolbarProps {
	/** Signal that a placement-oriented control is being adjusted. */
	onPlacementControlInteraction?: () => void;
}

/**
 * Toolbar for the media editor modal. Hosts the tactile cropper verbs —
 * fine rotation, snap rotate, and flip — so they stay within thumb reach
 * when the toolbar sits at the bottom of the modal. Undo/redo/reset live
 * alongside Save/Cancel in the modal footer; aspect-ratio presets and the
 * freeform toggle live in the Crop sidebar tab.
 * @param props
 * @param props.onPlacementControlInteraction
 */
export default function MediaEditorToolbar( {
	onPlacementControlInteraction,
}: MediaEditorToolbarProps ) {
	const { state, setRotation, setFlip, snapRotate90 } = useMediaEditor();
	// `commitOnKeyUp: false` lets rapid arrow-key adjustments coalesce
	// into one undo entry via the gesture idle window. Pointer-up still
	// closes pointer drags immediately.
	const rotationGestureHandlers = useCropGestureHandlers( {
		commitOnKeyUp: false,
	} );

	// `setRotation` is an absolute-angle setter. When a single flip is active
	// the visual direction inverts, so slider input must flip sign to match
	// what the user sees. `snapRotate90` already handles this internally.
	const baseAngle = Math.round( state.rotation / 90 ) * 90;
	const singleFlip = state.flip.horizontal !== state.flip.vertical;
	const visualDir = singleFlip ? -1 : 1;
	const fineOffset = ( state.rotation - baseAngle ) * visualDir;

	const handleRotationSlider = ( value: number ) => {
		// Clamp strictly inside [-MAX, MAX). Exactly ±MAX lands state on a
		// 90° midpoint and flips the derived baseAngle on the next render,
		// causing subsequent events to spiral.
		const EPS = 0.01;
		const clamped = Math.max(
			-MAX_ROTATION_OFFSET + EPS,
			Math.min( MAX_ROTATION_OFFSET - EPS, value )
		);
		onPlacementControlInteraction?.();
		setRotation( baseAngle + clamped * visualDir );
	};

	return (
		<Stack
			className="media-editor-toolbar"
			direction="row"
			align="center"
			justify="center"
			gap="sm"
			wrap="wrap"
		>
			<div
				role="presentation"
				className="media-editor-toolbar__rotation-slider"
				{ ...rotationGestureHandlers }
			>
				<RotationRuler
					label={ __( 'Fine rotation' ) }
					min={ -MAX_ROTATION_OFFSET }
					max={ MAX_ROTATION_OFFSET }
					value={ fineOffset }
					onChange={ handleRotationSlider }
				/>
			</div>
			<div className="media-editor-toolbar__action-cluster">
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
		</Stack>
	);
}
