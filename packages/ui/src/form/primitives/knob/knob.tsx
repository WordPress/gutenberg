import { Slider } from '@base-ui/react/slider';
import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useRef, useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { DirectionProvider } from '../../../utils/direction-provider';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import resetStyles from '../../../utils/css/resets.module.css';
import {
	DOT_OFFSET,
	DOT_RADIUS,
	VIEW_SIZE,
	clamp,
	crossesCenter,
	getDial,
	getStepChange,
	isOnDot,
	measure,
	modulo,
} from './dial';
import type { KnobProps } from './types';
import styles from './style.module.scss';

type Gesture = {
	pointerId: number;
	// The pointer position on the screen that the next move is measured from.
	// While the gesture is still a tap, that is where the press landed.
	clientX: number;
	clientY: number;
	// The angle a drag has turned the dial to, counted across turns. It is
	// null while the gesture is still a tap.
	dialAngle: number | null;
	// The step the gesture last selected, or null before it selects one.
	index: number | null;
	// The dial angle when the press landed on the dot, or null when it landed
	// elsewhere. A press on the dot takes hold of it where it is, so only
	// turning moves it.
	grabbedAt: number | null;
};

// Keep the thumb stationary. A zero translation keeps Base UI's fixed-position
// range input inside the dial so its focus target matches what is on screen.
const THUMB_STYLE = { insetInlineStart: 0, top: 0, translate: '0 0' };

// How far, in pixels, the pointer can slip during a tap.
const TAP_SLOP = 3;

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
			step: stepProp,
			largeStep,
			unitsPerTurn,
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
			step,
			precision,
			lastStep,
			firstAngle,
			lastAngle,
			stepAngle,
			toValue,
			toIndex,
			toAngle,
			fromAngle,
			exactAngle,
		} = getDial( { min, max, step: stepProp, unitsPerTurn } );
		const largeStepCount = Math.max(
			1,
			Math.round( ( largeStep ?? step * 10 ) / step )
		);
		const isEmpty = value === null;
		const shownValue =
			value === undefined ? uncontrolledValue : ( value ?? placeholder );
		const index = toIndex( shownValue );
		// Where the dot points, on a step.
		const angle = toAngle( index );
		// Where the value itself lies. A click counts its turn from here.
		const valueAngle = exactAngle( shownValue );

		function select( nextIndex: number ) {
			const nextValue = toValue( nextIndex );
			if ( value === undefined ) {
				setUncontrolledValue( nextValue );
			}
			onValueChange?.( nextValue );
		}

		// The pointer names a heading. Take it on the turn nearest to `from`,
		// so a click never moves the value by more than it has to.
		function getDialAngle( pointerAngle: number, from: number ) {
			if ( wraps ) {
				return (
					pointerAngle +
					360 * Math.round( ( from - pointerAngle ) / 360 )
				);
			}
			const start = clamp( from, firstAngle, lastAngle );
			const nearest =
				pointerAngle +
				360 * Math.round( ( start - pointerAngle ) / 360 );
			// Take the turn that has this heading, or else the one that
			// brings it closest to an end. A heading that rounds to an end
			// counts as within the range.
			const outside = ( dialAngle: number ) =>
				Math.max(
					firstAngle - dialAngle - stepAngle / 2,
					dialAngle - lastAngle - stepAngle / 2,
					0
				);
			return [ nearest - 360, nearest + 360 ].reduce(
				( best, candidate ) =>
					outside( candidate ) < outside( best ) ? candidate : best,
				nearest
			);
		}

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
			// The value changes once the pointer moves or lifts, so a
			// canceled press leaves it alone. The turn is chosen then too:
			// focusing the dial below can make a paired field commit a value.
			const pressed = measure( event.currentTarget )( event );
			gesture.current = {
				pointerId: event.pointerId,
				clientX: event.clientX,
				clientY: event.clientY,
				dialAngle: null,
				index: null,
				grabbedAt: isOnDot( pressed, angle ) ? angle : null,
			};
			// Keep the browser's default mouse action from moving focus back to the dial wrapper.
			event.preventDefault();
			event.currentTarget.setPointerCapture( event.pointerId );
			input.current.focus( { preventScroll: true } );
		}

		function handlePointerMoveOrUp(
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
			const isRelease = event.type === 'pointerup';
			const isTap = current.dialAngle === null;
			const locate = measure( event.currentTarget );
			const pointer = locate( event );
			// Whether the dot still points where the press took hold of it.
			const holdsDot =
				current.grabbedAt !== null &&
				Math.abs(
					modulo( current.grabbedAt - angle + 180, 360 ) - 180
				) < 1e-6;
			if ( isTap && isRelease ) {
				// A tap takes the heading where the pointer lifts, on the
				// turn nearest to the value. It is dropped when the pointer
				// lifts outside the dial or in its middle.
				if ( ! pointer.inside || pointer.angle === null ) {
					return;
				}
				const tapped = fromAngle(
					holdsDot ? angle : getDialAngle( pointer.angle, valueAngle )
				);
				// An empty dial has no value yet, so tapping the heading it
				// already points to is still a choice.
				if ( tapped !== index || isEmpty ) {
					select( tapped );
				}
				return;
			}
			const previous = locate( current );
			// The middle of the dial has no heading. A move that keeps the
			// heading turns nothing, as when a pen changes its pressure.
			if ( pointer.angle === null || pointer.angle === previous.angle ) {
				current.clientX = event.clientX;
				current.clientY = event.clientY;
				return;
			}
			// A drag starts from the dot while the press still holds it, or
			// else from the heading it left.
			const from =
				current.dialAngle ??
				( holdsDot || previous.angle === null
					? angle
					: getDialAngle( previous.angle, valueAngle ) );
			// A drag turns the dial the shorter way round, so the turn count
			// carries across twelve o'clock. A move that cuts across the dial
			// names a new heading.
			let dialAngle =
				previous.angle === null || crossesCenter( previous, pointer )
					? getDialAngle( pointer.angle, from )
					: from +
						modulo( pointer.angle - previous.angle + 180, 360 ) -
						180;
			if ( ! wraps ) {
				// Past an end, keep less than a turn. The dot then meets the
				// pointer as soon as it comes back round to that end.
				const beyond =
					dialAngle - clamp( dialAngle, firstAngle, lastAngle );
				dialAngle -= 360 * Math.trunc( beyond / 360 );
			}
			// A tap becomes a drag once the pointer has moved a few pixels
			// and reached another step. Until then it keeps its place.
			const slipped =
				Math.hypot(
					event.clientX - current.clientX,
					event.clientY - current.clientY
				) < TAP_SLOP ||
				Math.round( dialAngle / stepAngle ) ===
					Math.round( from / stepAngle );
			if ( isTap && slipped ) {
				return;
			}
			current.clientX = event.clientX;
			current.clientY = event.clientY;
			current.dialAngle = dialAngle;
			const nextIndex = fromAngle( dialAngle );
			// Compare with the step this gesture last selected. The value
			// prop can lag behind it while a parent has yet to update. The
			// first step an empty dial reaches is a choice even when it is
			// the one the dial points to.
			if (
				nextIndex !== ( current.index ?? index ) ||
				( isEmpty && current.index === null )
			) {
				current.index = nextIndex;
				select( nextIndex );
			}
		}

		function handleKeyDown(
			event: React.KeyboardEvent< HTMLInputElement >
		) {
			onKeyDown?.( event );
			if ( ! wraps || event.defaultPrevented ) {
				return;
			}
			const next =
				index + getStepChange( event, largeStepCount, isRTL() );
			if ( next < 0 || next > lastStep ) {
				event.preventDefault();
				event.stopPropagation();
				// Let the range report the wrapped value through Base UI's field handling.
				const range = event.currentTarget;
				range.valueAsNumber = toValue( modulo( next, lastStep + 1 ) );
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
					min={ toValue( 0 ) }
					max={ toValue( lastStep ) }
					step={ step }
					largeStep={ Number(
						( largeStepCount * step ).toFixed( precision )
					) }
					value={ toValue( index ) }
					onValueChange={ ( next ) => {
						const nextIndex = toIndex( next );
						if ( nextIndex !== index ) {
							select( nextIndex );
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
						onPointerMove={ handlePointerMoveOrUp }
						onPointerUp={ handlePointerMoveOrUp }
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
