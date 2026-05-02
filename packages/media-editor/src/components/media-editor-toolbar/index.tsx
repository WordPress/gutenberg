/**
 * WordPress dependencies
 */
import { Button, RangeControl } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { displayShortcut, isAppleOS } from '@wordpress/keycodes';
import {
	rotateLeft,
	rotateRight,
	flipHorizontal,
	flipVertical,
	undo,
	redo,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useCropper } from '../../image-editor';
import { useCropGestureHandlers } from '../../hooks/use-crop-gesture-handlers';
import { MAX_ROTATION_OFFSET } from '../../image-editor/core/constants';

export interface MediaEditorToolbarProps {
	/**
	 * Extra work to run when the user clicks Reset — e.g. clearing
	 * aspect-ratio / freeform state that lives outside the cropper
	 * controller.
	 */
	onReset?: () => void;
	/** Signal that a placement-oriented control is being adjusted. */
	onPlacementControlInteraction?: () => void;
}

/**
 * Toolbar for the media editor modal. Hosts the tactile cropper verbs —
 * rotate, flip, fine rotation, reset — so they stay within thumb reach
 * when the toolbar sits at the bottom of the modal. Aspect-ratio presets
 * and freeform toggle live in the Crop sidebar tab instead.
 * @param props
 * @param props.onReset
 * @param props.onPlacementControlInteraction
 */
export default function MediaEditorToolbar( {
	onReset,
	onPlacementControlInteraction,
}: MediaEditorToolbarProps ) {
	const {
		state,
		setRotation,
		setFlip,
		snapRotate90,
		reset,
		isDirty,
		hasUndo,
		hasRedo,
		undo: undoCrop,
		redo: redoCrop,
	} = useCropper();
	const rotationGestureHandlers = useCropGestureHandlers();

	const handleReset = () => {
		reset();
		onReset?.();
	};

	// `setRotation` is an absolute-angle setter. When a single flip is active
	// the visual direction inverts, so slider input must flip sign to match
	// what the user sees. `snapRotate90` already handles this internally.
	const baseAngle = Math.round( state.rotation / 90 ) * 90;
	const singleFlip = state.flip.horizontal !== state.flip.vertical;
	const visualDir = singleFlip ? -1 : 1;
	const fineOffset = ( state.rotation - baseAngle ) * visualDir;

	const handleRotationSlider = ( value: number | undefined ) => {
		if ( value === undefined ) {
			return;
		}
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
			<Button
				size="compact"
				icon={ undo }
				label={ __( 'Undo' ) }
				showTooltip
				shortcut={ displayShortcut.primary( 'z' ) }
				disabled={ ! hasUndo }
				accessibleWhenDisabled
				onClick={ undoCrop }
			/>
			<Button
				size="compact"
				icon={ redo }
				label={ __( 'Redo' ) }
				showTooltip
				shortcut={
					isAppleOS()
						? displayShortcut.primaryShift( 'z' )
						: displayShortcut.primary( 'y' )
				}
				disabled={ ! hasRedo }
				accessibleWhenDisabled
				onClick={ redoCrop }
			/>
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
			<div
				role="presentation"
				className="media-editor-toolbar__rotation-slider"
				{ ...rotationGestureHandlers }
			>
				<RangeControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Fine rotation' ) }
					hideLabelFromVision
					min={ -MAX_ROTATION_OFFSET }
					max={ MAX_ROTATION_OFFSET }
					step={ 0.5 }
					value={ fineOffset }
					onChange={ handleRotationSlider }
					showTooltip={ false }
				/>
			</div>
			<Button
				size="compact"
				variant="tertiary"
				disabled={ ! isDirty }
				accessibleWhenDisabled
				onClick={ handleReset }
			>
				{ __( 'Reset' ) }
			</Button>
		</Stack>
	);
}
