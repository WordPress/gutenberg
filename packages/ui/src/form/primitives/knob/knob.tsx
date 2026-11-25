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
	getDial,
	getPointer,
	getStepChange,
	modulo,
} from './dial';
import type { KnobProps } from './types';
import styles from './style.module.scss';

type Gesture = {
	pointerId: number;
	// The heading of the last pointer position, or null at the center.
	pointerAngle: number | null;
	// The angle the gesture has turned the dial to, counted across turns. It
	// is null until the first move or the release.
	dialAngle: number | null;
	// The step the gesture last selected, or null before it selects one.
	index: number | null;
	// Whether the press landed on the dot. It then takes hold of the dot where
	// it is, and only turning moves it.
	onDot: boolean;
};

// Keep the thumb stationary. A zero translation keeps Base UI's fixed-position
// range input inside the dial so its focus target matches what is on screen.
const THUMB_STYLE = { insetInlineStart: 0, top: 0, translate: '0 0' };

// The largest turn, in degrees, that one pointer move can add. A larger jump
// means the pointer cut across the dial instead of going around it.
const CUT_ACROSS = 120;

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
			toValue,
			toIndex,
			toAngle,
			fromAngle,
		} = getDial( { min, max, step: stepProp, unitsPerTurn } );
		const largeStepCount = Math.max(
			1,
			Math.round( ( largeStep ?? step * 10 ) / step )
		);
		const isEmpty = value === null;
		const index = toIndex(
			value === undefined ? uncontrolledValue : ( value ?? placeholder )
		);
		const angle = toAngle( index );

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
			// brings it closest to an end.
			const outside = ( dialAngle: number ) =>
				Math.max( firstAngle - dialAngle, dialAngle - lastAngle, 0 );
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
			const { angle: pointerAngle, onDot } = getPointer( event, angle );
			gesture.current = {
				pointerId: event.pointerId,
				pointerAngle,
				dialAngle: null,
				index: null,
				onDot,
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
			const { angle: pointerAngle, inside } = getPointer( event, angle );
			if ( pointerAngle === null ) {
				// There is no heading at the center. Pick one afresh when
				// the pointer leaves it.
				current.pointerAngle = null;
				return;
			}
			if ( pointerAngle === current.pointerAngle ) {
				// A pen reports changes in pressure as moves at the same
				// point. They leave a pending tap alone.
				if ( ! isRelease ) {
					return;
				}
				// A tap that has selected nothing is dropped when the
				// pointer lifts outside the dial.
				if ( current.index === null && ! inside ) {
					return;
				}
			}
			let from = current.dialAngle;
			if ( from === null ) {
				from =
					current.onDot || current.pointerAngle === null
						? angle
						: getDialAngle( current.pointerAngle, angle );
			}
			const turned =
				current.pointerAngle === null
					? null
					: modulo( pointerAngle - current.pointerAngle + 180, 360 ) -
						180;
			// A drag turns the dial the shorter way round, so the turn count
			// carries across twelve o'clock. A move out of the center, or one
			// that cuts across the dial, names a new heading.
			let dialAngle =
				turned === null || Math.abs( turned ) > CUT_ACROSS
					? getDialAngle( pointerAngle, from )
					: from + turned;
			if ( ! wraps ) {
				// Past an end, keep less than a turn. The dot then meets the
				// pointer as soon as it comes back round to that end.
				const beyond =
					dialAngle - clamp( dialAngle, firstAngle, lastAngle );
				dialAngle -= 360 * Math.trunc( beyond / 360 );
			}
			current.dialAngle = dialAngle;
			current.pointerAngle = pointerAngle;
			const nextIndex = fromAngle( dialAngle );
			// Compare with the step this gesture last selected. The value
			// prop can lag behind it while a parent has yet to update.
			const changed = nextIndex !== ( current.index ?? index );
			// An empty dial has no value yet, so releasing on the heading it
			// already points to is still a choice.
			if (
				changed ||
				( isEmpty && isRelease && current.index === null )
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
					// Base UI hides the thumb when its range is empty, so a
					// single selectable value still gets a range of one step.
					max={ toValue( Math.max( lastStep, 1 ) ) }
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
