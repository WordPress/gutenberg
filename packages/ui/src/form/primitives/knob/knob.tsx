import { Slider } from '@base-ui/react/slider';
import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useRef, useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { DirectionProvider } from '../../../utils/direction-provider';
import resetStyles from '../../../utils/css/resets.module.css';
import {
	BOUNDED_SWEEP,
	clamp,
	getAngleOnTurn,
	getPointerAngle,
	getStepRange,
	getStepChange,
	modulo,
} from './dial';
import type { KnobProps } from './types';
import styles from './style.module.scss';

type Drag = {
	pointerId: number;
	pointerAngle: number | null;
	dialAngle: number;
	tapOrigin: { x: number; y: number } | null;
};

// Keep the thumb stationary. A zero translation keeps Base UI's fixed-position
// range input inside the dial so its focus target matches what is on screen.
const THUMB_STYLE = { insetInlineStart: 0, top: 0, translate: '0 0' };

/**
 * A rotary slider for choosing a single number. Click or tap a position on the
 * dial, drag around its center, or use the arrow keys. Give it an accessible
 * name with Field.Label, aria-label, or aria-labelledby.
 */
export const Knob = forwardRef< HTMLDivElement, KnobProps >(
	function UnforwardedKnob(
		{
			min = 0,
			max = 100,
			step: stepProp = 1,
			largeStep = 10,
			wrap = false,
			unitsPerTurn,
			value,
			defaultValue = min,
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
		const drag = useRef< Drag | null >( null );
		const { step, precision, lastStep, toValue, toIndex } = getStepRange(
			min,
			max,
			stepProp
		);
		const largeStepCount = Math.max( 1, Math.round( largeStep / step ) );
		const index = clamp(
			toIndex( value ?? uncontrolledValue ),
			0,
			lastStep
		);
		const currentValue = toValue( index );
		let minAngle = wrap ? 0 : -BOUNDED_SWEEP / 2;
		let degreesPerStep = wrap
			? 360 / ( lastStep + 1 )
			: BOUNDED_SWEEP / Math.max( 1, lastStep );
		if (
			unitsPerTurn !== undefined &&
			Number.isFinite( unitsPerTurn ) &&
			unitsPerTurn > 0
		) {
			minAngle = ( min / unitsPerTurn ) * 360;
			degreesPerStep = ( step / unitsPerTurn ) * 360;
		}
		const maxAngle = minAngle + lastStep * degreesPerStep;
		const angle = minAngle + index * degreesPerStep;
		const tapBySide =
			degreesPerStep >= 360 || ( degreesPerStep === 180 && lastStep > 1 );
		// When the numeric cycle spans whole turns, wrapping preserves the heading.
		const cycleInTurns = ( ( lastStep + 1 ) * degreesPerStep ) / 360;
		const seamless =
			wrap &&
			Number.isInteger( Number( cycleInTurns.toPrecision( 15 ) ) );
		const sweep = seamless ? 360 : Math.min( 360, maxAngle - minAngle );
		const fullCircle = sweep === 360;

		function changeIndex( next: number ) {
			const nextIndex = wrap
				? modulo( next, lastStep + 1 )
				: clamp( next, 0, lastStep );
			const nextValue = toValue( nextIndex );
			if ( nextValue === currentValue ) {
				return;
			}
			if ( value === undefined ) {
				setUncontrolledValue( nextValue );
			}
			onValueChange?.( nextValue );
		}

		function handlePointerDown(
			event: React.PointerEvent< HTMLDivElement >
		) {
			if (
				drag.current ||
				! event.isPrimary ||
				event.button !== 0 ||
				! input.current?.matches( ':enabled' )
			) {
				return;
			}
			const pointerAngle = getPointerAngle( event );
			drag.current = {
				pointerId: event.pointerId,
				pointerAngle,
				tapOrigin: tapBySide
					? { x: event.clientX, y: event.clientY }
					: null,
				dialAngle:
					pointerAngle === null || tapBySide
						? angle
						: getAngleOnTurn(
								pointerAngle,
								angle,
								minAngle,
								maxAngle,
								seamless,
								degreesPerStep
							),
			};
			// Keep the browser's default mouse action from moving focus back to the dial wrapper.
			event.preventDefault();
			event.currentTarget.setPointerCapture( event.pointerId );
			input.current.focus( { preventScroll: true } );
		}

		function updateFromPointer(
			event: React.PointerEvent< HTMLDivElement >
		) {
			const gesture = drag.current;
			if (
				! gesture ||
				gesture.pointerId !== event.pointerId ||
				! input.current?.matches( ':enabled' )
			) {
				return;
			}
			const pointerAngle = getPointerAngle( event );
			if ( gesture.tapOrigin ) {
				// A whole step can lead back to the same heading. Tap either side
				// to step, or start a drag from the current value after a small movement.
				const distance = Math.hypot(
					event.clientX - gesture.tapOrigin.x,
					event.clientY - gesture.tapOrigin.y
				);
				if ( distance < 4 ) {
					if (
						event.type === 'pointerup' &&
						pointerAngle !== null &&
						Math.abs( pointerAngle ) < 180
					) {
						changeIndex( index + Math.sign( pointerAngle ) );
					}
					return;
				}
				gesture.tapOrigin = null;
			}
			if ( pointerAngle === null ) {
				return;
			}
			let nextAngle;
			if ( gesture.pointerAngle === null ) {
				nextAngle = tapBySide
					? gesture.dialAngle
					: getAngleOnTurn(
							pointerAngle,
							gesture.dialAngle,
							minAngle,
							maxAngle,
							seamless,
							degreesPerStep
						);
			} else {
				// Carry the turn count across twelve o'clock in either direction.
				const delta = pointerAngle - gesture.pointerAngle;
				nextAngle =
					gesture.dialAngle + ( modulo( delta + 180, 360 ) - 180 );
			}
			gesture.dialAngle = wrap
				? nextAngle
				: clamp( nextAngle, minAngle, maxAngle );
			gesture.pointerAngle = pointerAngle;
			changeIndex(
				Math.round( ( gesture.dialAngle - minAngle ) / degreesPerStep )
			);
		}

		function handleKeyDown(
			event: React.KeyboardEvent< HTMLInputElement >
		) {
			onKeyDown?.( event );
			if ( ! wrap || event.defaultPrevented ) {
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
						resetStyles[ 'box-sizing' ],
						styles.root,
						className
					) }
					min={ min }
					max={ toValue( lastStep ) }
					step={ step }
					largeStep={ Number(
						( largeStepCount * step ).toFixed( precision )
					) }
					value={ currentValue }
					onValueChange={ ( next ) => changeIndex( toIndex( next ) ) }
				>
					<Slider.Thumb
						className={ styles.thumb }
						style={ THUMB_STYLE }
						inputRef={ mergedInputRef }
						aria-label={ ariaLabel }
						aria-labelledby={ ariaLabelledBy }
						aria-describedby={ ariaDescribedBy }
						aria-valuetext={ ariaValueText }
						getAriaValueText={ getAriaValueText }
						tabIndex={ tabIndex }
						onKeyDown={ handleKeyDown }
						onPointerDown={ handlePointerDown }
						onPointerMove={ updateFromPointer }
						onPointerUp={ updateFromPointer }
						onLostPointerCapture={ ( event ) => {
							if ( drag.current?.pointerId === event.pointerId ) {
								drag.current = null;
							}
						} }
					>
						<svg
							viewBox="0 0 48 48"
							aria-hidden="true"
							focusable="false"
						>
							<g
								transform={ `rotate(${ ( fullCircle ? 0 : minAngle ) - 90 } 24 24)` }
								fill="none"
							>
								<circle
									className={ styles.track }
									cx="24"
									cy="24"
									r="21"
									pathLength="360"
									strokeDasharray={ `${ sweep } 360` }
								/>
								{ fullCircle && (
									<path
										className={ styles.track }
										d="M45 24h-3"
									/>
								) }
								{ ! fullCircle && index > 0 && (
									<circle
										className={ styles.fill }
										cx="24"
										cy="24"
										r="21"
										pathLength="360"
										strokeDasharray={ `${ angle - minAngle } 360` }
									/>
								) }
							</g>
							<circle
								className={ styles.face }
								cx="24"
								cy="24"
								r="16"
							/>
							<path
								className={ styles.pointer }
								d="M24 12v12"
								transform={ `rotate(${ angle } 24 24)` }
							/>
						</svg>
					</Slider.Thumb>
				</Slider.Root>
			</DirectionProvider>
		);
	}
);
