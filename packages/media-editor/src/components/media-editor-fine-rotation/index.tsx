import { __ } from '@wordpress/i18n';
import { useMediaEditor } from '../../state';
import { useCropGestureHandlers } from '../../hooks/use-crop-gesture-handlers';
import { fineRotation } from '../../image-editor/core/fine-rotation';
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

	const fineOffset = fineRotation.offsetFromState(
		state.rotation,
		state.flip
	);

	const handleRotationSlider = ( value: number ) => {
		onPlacementControlInteraction?.();
		setRotation(
			fineRotation.absoluteFromOffset(
				state.rotation,
				state.flip,
				value
			)
		);
	};

	return (
		<div
			role="presentation"
			className="media-editor-fine-rotation"
			{ ...rotationGestureHandlers }
		>
			<RotationRuler
				label={ __( 'Fine rotation' ) }
				min={ fineRotation.min }
				max={ fineRotation.max }
				value={ fineOffset }
				onChange={ handleRotationSlider }
			/>
		</div>
	);
}
