import { Slider } from '@base-ui/react/slider';
import clsx from 'clsx';
import { useEvent, useMergeRefs } from '@wordpress/compose';
import { flushSync, forwardRef, useRef, useState } from '@wordpress/element';
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
	// The angle the gesture has turned the dial to, counted across turns and
	// not limited to the range.
	angle: number;
	// The step the gesture last selected, or the step the dial showed when
	// it began.
	step: number;
	// Whether the value is still off that step: unset, between two steps, or
	// outside the range. A press or a move through the middle then selects
	// its step even when it is the one the dial already shows.
	offStep: boolean;
	// The angle a press counts its turn from: the value as given, and then
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
		const {
			wraps,
			stepsPerTurn: perTurn,
			first,
			last,
			snap,
			toAngle,
			fromAngle,
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
		function selectReached( current: Gesture, names: boolean ) {
			const reached = fromAngle( current.angle );
			if ( reached !== current.step || ( names && current.offStep ) ) {
				current.step = reached;
				current.offStep = false;
				current.reference = toAngle( reached );
				select( reached );
			}
		}

		// Starts a gesture from a press. It runs as an event callback so that
		// it sees the render that follows the change of focus, with whatever
		// value, range, or handler a paired field committed on the way.
		const startGesture = useEvent(
			( dial: HTMLElement, event: React.PointerEvent ) => {
				if ( ! input.current?.matches( ':enabled' ) ) {
					return;
				}
				dial.setPointerCapture( event.pointerId );
				const pointer = measure( dial )( event );
				// A press on the dot, or in the middle where there is no
				// heading, takes hold of the dial where it is. A press
				// anywhere else turns it to that heading.
				const reference = toAngle( shownValue );
				const turnsTo =
					pointer.heading === null || isOnDot( pointer, angle )
						? null
						: press( pointer.heading, reference );
				gesture.current = {
					pointerId: event.pointerId,
					...pointer,
					angle: turnsTo ?? angle,
					reference,
					step: shown,
					offStep: isEmpty || shown !== shownValue,
				};
				// A press on a heading names it. So does any press on an
				// empty dial, which sets the value it shows.
				selectReached( gesture.current, turnsTo !== null || isEmpty );
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
			// The gesture is over once the primary button or contact is up.
			// A pen can keep the pointer captured with its other button.
			if ( event.buttons % 2 === 0 ) {
				gesture.current = null;
				return;
			}
			// The dial is measured on every move, because it can move on the
			// page. Positions in its middle have no heading and are skipped.
			const pointer = measure( event.currentTarget )( event );
			if ( pointer.heading === null ) {
				return;
			}
			// A move turns the dial as far as the pointer went round, the
			// shorter way. The total keeps counting across twelve o'clock and
			// past the ends, so the dot waits at an end until the pointer
			// comes back. A move through the middle has no way round, so it
			// selects the heading it lands on, like a press. The first
			// heading after a press in the middle only starts the count.
			const crossed =
				current.heading !== null && crossesMiddle( current, pointer );
			if ( crossed ) {
				current.angle = press( pointer.heading, current.reference );
			} else if ( current.heading !== null ) {
				current.angle += turnBetween(
					current.heading,
					pointer.heading
				);
			}
			Object.assign( current, pointer );
			selectReached( current, crossed );
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
				select( end );
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
