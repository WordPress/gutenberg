/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useMediaEditor } from '../../state';
import { useCropGestureHandlers } from '../../hooks/use-crop-gesture-handlers';
import { MAX_ROTATION_OFFSET } from '../../image-editor/core/constants';
import RotationRuler from '../rotation-ruler';

export interface MediaEditorFineRotationProps {
	/** Signal that a placement-oriented control is being adjusted. */
	onPlacementControlInteraction?: () => void;
}

/**
 * Fine-rotation slider for the media editor. It renders under the canvas so it
 * stays constrained to the canvas column at all viewport sizes. Lives
 * separately from the snap-rotate / flip buttons so the two can be placed
 * independently per viewport.
 *
 * @param props
 * @param props.onPlacementControlInteraction
 */
export default function MediaEditorFineRotation( {
	onPlacementControlInteraction,
}: MediaEditorFineRotationProps ) {
	const { state, setRotation } = useMediaEditor();
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
		<div
			role="presentation"
			className="media-editor-fine-rotation"
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
	);
}
