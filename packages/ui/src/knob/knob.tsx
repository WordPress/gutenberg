import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import type { KnobProps } from './types';
import {
	FULL_TURN,
	clamp,
	getNearestEquivalent,
	getPointerAngle,
	getShortestTurn,
	roundToStep,
	wrapAngle,
} from './utils';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.scss';

function getDefaultAriaValueText( value: number | null ) {
	if ( value === null ) {
		return __( 'Not set' );
	}
	return sprintf(
		/* translators: %s: angle in degrees. */
		_n( '%s degree', '%s degrees', value ),
		String( value )
	);
}

/**
 * A circular dial for choosing an angle by dragging or with the keyboard.
 * `0` points up and values increase clockwise.
 *
 * Without `min` and `max`, the dial covers one full turn and wraps around.
 * With them, it stops at the ends and can count several turns.
 */
export const Knob = forwardRef< HTMLDivElement, KnobProps >(
	function UnforwardedKnob(
		{
			value: valueProp,
			defaultValue = 0,
			onValueChange,
			min: minProp,
			max: maxProp,
			step = 1,
			largeStep = 10,
			disabled = false,
			getAriaValueText = getDefaultAriaValueText,
			className,
			render,
			...restProps
		},
		ref
	) {
		const isControlled = valueProp !== undefined;
		const [ uncontrolledValue, setUncontrolledValue ] =
			useState( defaultValue );
		const value = isControlled ? valueProp : uncontrolledValue;
		// Pointer moves can arrive before a render, so compare against the
		// last value reported rather than the rendered one.
		const latestValueRef = useRef( value );
		latestValueRef.current = value;

		const wraps = minProp === undefined && maxProp === undefined;
		const min = minProp ?? 0;
		const max = maxProp ?? ( wraps ? FULL_TURN - step : FULL_TURN );

		// Read during a drag instead of `value`, which can lag between events.
		const dragStateRef = useRef< {
			rect: DOMRect;
			lastPointerAngle: number;
			unclampedValue: number;
		} >( undefined );
		const [ isDragging, setIsDragging ] = useState( false );

		const setValue = ( nextValue: number ) => {
			if ( nextValue === latestValueRef.current ) {
				return;
			}
			latestValueRef.current = nextValue;
			if ( ! isControlled ) {
				setUncontrolledValue( nextValue );
			}
			onValueChange?.( nextValue );
		};

		const toValue = ( unclampedValue: number ) =>
			wraps
				? wrapAngle( roundToStep( unclampedValue, step, 0 ) )
				: clamp( roundToStep( unclampedValue, step, min ), min, max );

		const referenceValue = wraps
			? wrapAngle( value ?? 0 )
			: clamp( value ?? 0, min, max );

		const turnDial = ( event: React.PointerEvent< HTMLDivElement > ) => {
			const dragState = dragStateRef.current;
			if ( dragState === undefined ) {
				return;
			}
			const angle = getPointerAngle(
				dragState.rect,
				event.clientX,
				event.clientY
			);
			// Between two events the pointer is taken to have turned the short
			// way round, so a fast flick of more than half a turn reverses.
			dragState.unclampedValue += getShortestTurn(
				dragState.lastPointerAngle,
				angle
			);
			dragState.lastPointerAngle = angle;
			setValue( toValue( dragState.unclampedValue ) );
		};

		const endDrag = () => {
			dragStateRef.current = undefined;
			setIsDragging( false );
		};

		const handlePointerDown = (
			event: React.PointerEvent< HTMLDivElement >
		) => {
			if ( event.button !== 0 ) {
				return;
			}
			// The default action focuses the dial without a focus ring, and
			// `user-select: none` keeps the drag from selecting text.
			const element = event.currentTarget;
			element.setPointerCapture( event.pointerId );

			const rect = element.getBoundingClientRect();
			const angle = getPointerAngle( rect, event.clientX, event.clientY );
			// Picks the angle a click points at that is nearest the current
			// value, so a click never jumps a whole turn.
			const unclampedValue = wraps
				? angle
				: getNearestEquivalent( angle, referenceValue );
			dragStateRef.current = {
				rect,
				lastPointerAngle: angle,
				unclampedValue,
			};
			setIsDragging( true );
			setValue( toValue( unclampedValue ) );
		};

		const handleKeyDown = (
			event: React.KeyboardEvent< HTMLDivElement >
		) => {
			const increment = event.shiftKey ? largeStep : step;
			let nextValue: number;
			switch ( event.key ) {
				case 'ArrowUp':
				case 'ArrowRight':
					nextValue = toValue( referenceValue + increment );
					break;
				case 'ArrowDown':
				case 'ArrowLeft':
					nextValue = toValue( referenceValue - increment );
					break;
				case 'PageUp':
					nextValue = toValue( referenceValue + largeStep );
					break;
				case 'PageDown':
					nextValue = toValue( referenceValue - largeStep );
					break;
				case 'Home':
					nextValue = min;
					break;
				case 'End':
					nextValue = max;
					break;
				default:
					return;
			}
			event.preventDefault();
			setValue( nextValue );
		};

		const interactionProps = disabled
			? {}
			: {
					tabIndex: 0,
					onPointerDown: handlePointerDown,
					onPointerMove: turnDial,
					onPointerUp: (
						event: React.PointerEvent< HTMLDivElement >
					) => {
						turnDial( event );
						endDrag();
					},
					onPointerCancel: endDrag,
					onLostPointerCapture: endDrag,
					onKeyDown: handleKeyDown,
				};

		return useRender( {
			defaultTagName: 'div',
			render,
			state: { disabled, dragging: isDragging },
			ref,
			props: mergeProps< 'div' >(
				{
					role: 'slider',
					'aria-valuemin': min,
					'aria-valuemax': max,
					// Required for a slider; the value text says when it is empty.
					'aria-valuenow': value ?? referenceValue,
					'aria-valuetext': getAriaValueText( value ),
					'aria-disabled': disabled || undefined,
					className: clsx(
						resetStyles[ 'box-sizing' ],
						defenseStyles.div,
						styles.knob,
						className
					),
					children: value !== null && (
						<span
							className={ styles.indicator }
							style={ { transform: `rotate(${ value }deg)` } }
						/>
					),
				},
				interactionProps,
				restProps
			),
		} );
	}
);
