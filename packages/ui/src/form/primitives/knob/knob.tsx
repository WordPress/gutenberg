import { Slider } from '@base-ui/react/slider';
import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useRef, useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { DirectionProvider } from '../../../utils/direction-provider';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import resetStyles from '../../../utils/css/resets.module.css';
import { clamp, getDial, getPointerAngle, getStepChange, modulo } from './dial';
import type { KnobProps } from './types';
import styles from './style.module.scss';

type Gesture = {
	pointerId: number;
	pointerAngle: number | null;
	dialAngle: number;
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
			degreesPerStep,
			firstAngle,
			lastAngle,
			toValue,
			toIndex,
			toAngle,
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

		function selectIndex( next: number, evenIfUnchanged = false ) {
			const nextIndex = wraps
				? modulo( next, lastStep + 1 )
				: clamp( next, 0, lastStep );
			if ( nextIndex === index && ! evenIfUnchanged ) {
				return;
			}
			const nextValue = toValue( nextIndex );
			if ( value === undefined ) {
				setUncontrolledValue( nextValue );
			}
			onValueChange?.( nextValue );
		}

		function selectAngle( dialAngle: number, evenIfUnchanged = false ) {
			const turned = wraps
				? modulo( dialAngle, 360 )
				: dialAngle - firstAngle;
			selectIndex(
				Math.round( turned / degreesPerStep ),
				evenIfUnchanged
			);
		}

		// The pointer names a heading. Take it on the turn nearest to `from`,
		// so a click never moves the value by more than it has to.
		function getDialAngle( pointerAngle: number, from: number ) {
			const nearest =
				pointerAngle +
				360 * Math.round( ( from - pointerAngle ) / 360 );
			if ( wraps ) {
				return nearest;
			}
			return (
				[ nearest, nearest - 360, nearest + 360 ].find(
					( candidate ) =>
						candidate >= firstAngle && candidate <= lastAngle
				) ?? clamp( nearest, firstAngle, lastAngle )
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
			const pointerAngle = getPointerAngle( event );
			const dialAngle =
				pointerAngle === null
					? angle
					: getDialAngle( pointerAngle, angle );
			gesture.current = {
				pointerId: event.pointerId,
				pointerAngle,
				dialAngle,
			};
			// Keep the browser's default mouse action from moving focus back to the dial wrapper.
			event.preventDefault();
			event.currentTarget.setPointerCapture( event.pointerId );
			input.current.focus( { preventScroll: true } );
			if ( pointerAngle !== null ) {
				// An empty dial has no value yet, so picking the heading it
				// already points to is still a choice.
				selectAngle( dialAngle, isEmpty );
			}
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
			const pointerAngle = getPointerAngle( event );
			if ( pointerAngle === null ) {
				return;
			}
			const nextAngle =
				current.pointerAngle === null
					? getDialAngle( pointerAngle, current.dialAngle )
					: // Add the shorter way round, so the turn count carries across twelve o'clock.
						current.dialAngle +
						modulo(
							pointerAngle - current.pointerAngle + 180,
							360
						) -
						180;
			current.dialAngle = wraps
				? nextAngle
				: clamp( nextAngle, firstAngle, lastAngle );
			current.pointerAngle = pointerAngle;
			selectAngle( current.dialAngle );
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
					onValueChange={ ( next ) => selectIndex( toIndex( next ) ) }
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
							viewBox="0 0 40 40"
							aria-hidden="true"
							focusable="false"
						>
							<circle
								className={ styles.outline }
								cx="20"
								cy="20"
								r="19.5"
							/>
							<circle
								className={ styles.indicator }
								cx="20"
								cy="10"
								r={ isEmpty ? 3 : 4 }
								transform={ `rotate(${ angle } 20 20)` }
							/>
						</svg>
					</Slider.Thumb>
				</Slider.Root>
			</DirectionProvider>
		);
	}
);
