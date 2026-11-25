import { Slider } from '@base-ui/react/slider';
import clsx from 'clsx';
import { useEvent, useMergeRefs } from '@wordpress/compose';
import {
	flushSync,
	forwardRef,
	useCallback,
	useRef,
	useState,
} from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { DirectionProvider } from '../../../utils/direction-provider';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import resetStyles from '../../../utils/css/resets.module.css';
import {
	DOT_OFFSET,
	DOT_RADIUS,
	VIEW_SIZE,
	crossesMiddle,
	getDial,
	getStepChange,
	isOnDot,
	measure,
	modulo,
	turnBetween,
} from './dial';
import type { KnobProps } from './types';
import styles from './style.module.scss';

// What a pointer gesture keeps between its events. A press writes all of it,
// and each move updates it.
type Gesture = {
	pointerId: number;
	// The last pointer position that had a heading, in the units the dial is
	// drawn in. Until there is one, it is where the press landed.
	x: number;
	y: number;
	heading: number | null;
	// The unsnapped position in steps, counted across turns and past stops.
	position: number;
	stepsPerTurn: number;
	// The step the gesture last selected, or the step the dial showed when
	// it began.
	step: number;
	// Whether the value is still off that step: unset, between two steps, or
	// outside the range. A press or a move through the middle then selects
	// its step even when it is the one the dial already shows.
	offStep: boolean;
	// The value a press counts its turn from: the value as given, and then
	// the step the gesture last selected.
	reference: number;
};

// Keep the thumb stationary. A zero translation keeps Base UI's fixed-position
// range input inside the dial so its focus target matches what is on screen.
const THUMB_STYLE = { insetInlineStart: 0, top: 0, translate: '0 0' };

/**
 * A dial for choosing an angle. It sits beside an input that shows the exact
 * number and edits the same value. Click or tap a heading, drag around the
 * center, or use the arrow keys.
 *
 * Without `min` and `max` the dial covers one turn and wraps. With both, it
 * stops at the ends and counts the turns in between.
 */
export const Knob = forwardRef< HTMLDivElement, KnobProps >(
	function UnforwardedKnob(
		{
			min,
			max,
			largeStep = 10,
			stepsPerTurn,
			value,
			defaultValue = 0,
			placeholder = 0,
			onValueChange,
			onKeyDown,
			inputRef,
			className,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			'aria-describedby': ariaDescribedBy,
			'aria-valuetext': ariaValueText,
			getAriaValueText,
			tabIndex,
			...props
		},
		ref
	) {
		const [ uncontrolledValue, setUncontrolledValue ] =
			useState( defaultValue );
		const input = useRef< HTMLInputElement >( null );
		const mergedInputRef = useMergeRefs( [ input, inputRef ] );
		const gesture = useRef< Gesture | null >( null );
		// A removed capture target can lose capture on the document instead.
		const resetGestureOnThumbChange = useCallback( () => {
			gesture.current = null;
		}, [] );
		const {
			wraps,
			stepsPerTurn: perTurn,
			first,
			last,
			snap,
			toAngle,
			toSteps,
			press,
		} = getDial( { min, max, stepsPerTurn } );
		const largeStepCount = Math.max( 1, Math.round( largeStep ) );
		const isEmpty = value === null;
		const shownValue =
			value === undefined ? uncontrolledValue : ( value ?? placeholder );
		// The step the dial shows, and where its dot points.
		const shown = snap( shownValue );
		const angle = toAngle( shown );

		function select( next: number ) {
			if ( value === undefined ) {
				setUncontrolledValue( next );
			}
			onValueChange?.( next );
		}

		// Selects the step the gesture has reached, when it is a new one. The
		// gesture remembers its own last step, because the value prop can lag
		// behind while a parent has yet to update. `names` says that the
		// pointer named this heading, by a press or a move through the
		// middle, and did not just turn the dial.
		function updateStep( current: Gesture, names: boolean ) {
			const reached = snap( current.position );
			if ( reached !== current.step || ( names && current.offStep ) ) {
				current.step = reached;
				current.offStep = false;
				current.reference = reached;
				return true;
			}
			return false;
		}

		// Starts a gesture from a press. It runs as an event callback so that
		// it sees the render that follows the change of focus, with whatever
		// value, range, or handler a paired field committed on the way.
		const startGesture = useEvent(
			( dial: HTMLElement, event: React.PointerEvent ) => {
				if (
					! dial.isConnected ||
					! input.current?.matches( ':enabled' )
				) {
					return;
				}
				dial.setPointerCapture( event.pointerId );
				const pointer = measure( dial )( event );
				// A press on the dot, or in the middle where there is no
				// heading, takes hold of the dial where it is. A press
				// anywhere else turns it to that heading.
				const turnsTo =
					pointer.heading === null || isOnDot( pointer, angle )
						? null
						: press( pointer.heading, shownValue );
				gesture.current = {
					pointerId: event.pointerId,
					...pointer,
					position: turnsTo ?? shown,
					stepsPerTurn: perTurn,
					reference: shownValue,
					step: shown,
					offStep: isEmpty || shown !== shownValue,
				};
				// A press on a heading names it. So does any press on an
				// empty dial, which sets the value it shows.
				if (
					updateStep( gesture.current, turnsTo !== null || isEmpty )
				) {
					select( gesture.current.step );
				}
			}
		);

		function handlePointerDown(
			event: React.PointerEvent< HTMLDivElement >
		) {
			if (
				gesture.current ||
				! event.isPrimary ||
				event.button !== 0 ||
				! input.current?.matches( ':enabled' )
			) {
				return;
			}
			// Keep the browser's default mouse action from moving focus back to the dial wrapper.
			event.preventDefault();
			// Focus the dial before the gesture starts. A paired field that
			// commits when it loses focus then has its say first.
			flushSync( () => input.current?.focus( { preventScroll: true } ) );
			startGesture( event.currentTarget, event );
		}

		function handlePointerMove(
			event: React.PointerEvent< HTMLDivElement >
		) {
			const current = gesture.current;
			if (
				! current ||
				current.pointerId !== event.pointerId ||
				! input.current?.matches( ':enabled' )
			) {
				return;
			}
			// Convert both the pointer position and the gesture's last value.
			// The parent may still show an earlier value in the new unit.
			if ( current.stepsPerTurn !== perTurn ) {
				const rescale = ( steps: number ) =>
					( steps * perTurn ) / current.stepsPerTurn;
				current.position = rescale( current.position );
				current.reference = rescale( current.reference );
				current.step = snap( current.reference );
				current.offStep = current.reference !== current.step;
				current.stepsPerTurn = perTurn;
			}
			const previousStep = current.step;
			const wasOffStep = current.offStep;
			const locate = measure( event.currentTarget );
			// A browser can combine a curved path into one move. Its two
			// endpoints alone can look like a shortcut through the middle.
			const { nativeEvent } = event;
			const coalesced = nativeEvent.getCoalescedEvents?.();
			const samples = coalesced?.length ? coalesced : [ nativeEvent ];
			for ( const sample of samples ) {
				if ( sample.buttons % 2 === 0 ) {
					// A pen can lift its tip while another button keeps it captured.
					gesture.current = null;
					break;
				}
				const pointer = locate( sample );
				if ( pointer.heading === null ) {
					continue;
				}
				const crossed =
					current.heading !== null &&
					crossesMiddle( current, pointer );
				if ( crossed ) {
					current.position = press(
						pointer.heading,
						current.reference
					);
				} else if ( current.heading !== null ) {
					current.position += toSteps(
						turnBetween( current.heading, pointer.heading )
					);
				}
				Object.assign( current, pointer );
				updateStep( current, crossed );
			}
			// Report one value for the move even when it contained several samples.
			if (
				current.step !== previousStep ||
				( wasOffStep && ! current.offStep )
			) {
				select( current.step );
			}
		}

		function handleKeyDown(
			event: React.KeyboardEvent< HTMLInputElement >
		) {
			onKeyDown?.( event );
			if ( event.defaultPrevented ) {
				return;
			}
			// Home and End select an end even when the dial already shows it
			// for a value that is unset or outside the range. The slider
			// sees no change there, so it reports none.
			const end = event.key === 'End' ? last : first;
			if (
				( event.key === 'Home' || event.key === 'End' ) &&
				end === shown &&
				( isEmpty || shown !== shownValue )
			) {
				select( shown );
				return;
			}
			if ( ! wraps ) {
				return;
			}
			const next =
				shown + getStepChange( event, largeStepCount, isRTL() );
			if ( next < first || next > last ) {
				event.preventDefault();
				event.stopPropagation();
				// Let the range report the wrapped value through Base UI's field handling.
				const range = event.currentTarget;
				range.valueAsNumber = modulo( next, perTurn );
				range.dispatchEvent( new Event( 'input', { bubbles: true } ) );
			}
		}

		return (
			<DirectionProvider>
				<Slider.Root< number >
					{ ...props }
					ref={ ref }
					className={ clsx(
						defenseStyles.div,
						resetStyles[ 'box-sizing' ],
						styles.root,
						className
					) }
					min={ first }
					max={ last }
					step={ 1 }
					largeStep={ largeStepCount }
					value={ shown }
					onValueChange={ ( next ) => {
						const nextStep = snap( next );
						if ( nextStep !== shown ) {
							select( nextStep );
						}
					} }
				>
					<Slider.Thumb
						ref={ resetGestureOnThumbChange }
						className={ styles.thumb }
						style={ THUMB_STYLE }
						data-empty={ isEmpty ? '' : undefined }
						inputRef={ mergedInputRef }
						aria-label={ ariaLabel }
						aria-labelledby={ ariaLabelledBy }
						aria-describedby={ ariaDescribedBy }
						aria-valuetext={ ariaValueText }
						getAriaValueText={ getAriaValueText }
						tabIndex={ tabIndex }
						onKeyDown={ handleKeyDown }
						onPointerDown={ handlePointerDown }
						onPointerMove={ handlePointerMove }
						onLostPointerCapture={ ( event ) => {
							if (
								gesture.current?.pointerId === event.pointerId
							) {
								gesture.current = null;
							}
						} }
					>
						<svg
							viewBox={ `0 0 ${ VIEW_SIZE } ${ VIEW_SIZE }` }
							aria-hidden="true"
							focusable="false"
						>
							<circle
								className={ styles.outline }
								cx={ VIEW_SIZE / 2 }
								cy={ VIEW_SIZE / 2 }
								r={ VIEW_SIZE / 2 - 0.5 }
							/>
							<circle
								className={ styles.indicator }
								cx={ VIEW_SIZE / 2 }
								cy={ VIEW_SIZE / 2 - DOT_OFFSET }
								r={ isEmpty ? DOT_RADIUS - 1 : DOT_RADIUS }
								transform={ `rotate(${ angle } ${ VIEW_SIZE / 2 } ${
									VIEW_SIZE / 2
								})` }
							/>
						</svg>
					</Slider.Thumb>
				</Slider.Root>
			</DirectionProvider>
		);
	}
);
