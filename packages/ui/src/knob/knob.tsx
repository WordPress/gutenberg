import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import type { KnobProps, KnobUnit } from './types';
import {
	DEFAULT_STEPS,
	FULL_TURN,
	clamp,
	getLastStepInTurn,
	getNearestEquivalent,
	getPointerAngle,
	getShortestTurn,
	roundToStep,
	wrapAngle,
	wrapToStep,
} from './utils';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.scss';

function getDefaultAriaValueText( value: number | null, unit: KnobUnit ) {
	if ( value === null ) {
		return __( 'Not set' );
	}
	const formatted = String( value );
	switch ( unit ) {
		case 'turn':
			return sprintf(
				/* translators: %s: angle in turns. */
				_n( '%s turn', '%s turns', value ),
				formatted
			);
		case 'rad':
			return sprintf(
				/* translators: %s: angle in radians. */
				_n( '%s radian', '%s radians', value ),
				formatted
			);
		case 'grad':
			return sprintf(
				/* translators: %s: angle in gradians. */
				_n( '%s gradian', '%s gradians', value ),
				formatted
			);
		default:
			return sprintf(
				/* translators: %s: angle in degrees. */
				_n( '%s degree', '%s degrees', value ),
				formatted
			);
	}
}

/**
 * A circular dial for choosing an angle by dragging or with the keyboard.
 * `0` points up and values increase clockwise.
 *
 * Without `min` and `max`, the dial covers one full turn and wraps around.
 * With them, it stops at the ends and can count several turns. Values are
 * in `unit`, which accepts any CSS angle unit.
 */
export const Knob = forwardRef< HTMLDivElement, KnobProps >(
	function UnforwardedKnob(
		{
			value: valueProp,
			defaultValue = 0,
			onValueChange,
			unit = 'deg',
			min: minProp,
			max: maxProp,
			step = DEFAULT_STEPS[ unit ].step,
			largeStep = DEFAULT_STEPS[ unit ].largeStep,
			disabled = false,
			getAriaValueText,
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

		const fullTurn = FULL_TURN[ unit ];
		const wraps = minProp === undefined && maxProp === undefined;
		const min = minProp ?? 0;
		const max =
			maxProp ??
			( wraps
				? getLastStepInTurn( step, fullTurn )
				: roundToStep( fullTurn, step, 0 ) );

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
				? wrapToStep( unclampedValue, step, fullTurn )
				: clamp( roundToStep( unclampedValue, step, min ), min, max );

		const referenceValue = wraps
			? wrapAngle( value ?? 0, fullTurn )
			: clamp( value ?? 0, min, max );

		// The keys cycle through the steps in one turn, so they wrap from the
		// last step to 0 even when a turn is not a whole number of steps.
		const stepCycle = roundToStep( max + step, step, 0 );
		const stepBy = ( delta: number ) =>
			wraps
				? wrapToStep( referenceValue + delta, step, stepCycle )
				: toValue( referenceValue + delta );

		const turnDial = ( event: React.PointerEvent< HTMLDivElement > ) => {
			const dragState = dragStateRef.current;
			if ( dragState === undefined ) {
				return;
			}
			const angle = getPointerAngle(
				dragState.rect,
				event.clientX,
				event.clientY,
				fullTurn
			);
			// Between two events the pointer is taken to have turned the short
			// way round, so a fast flick of more than half a turn reverses.
			dragState.unclampedValue += getShortestTurn(
				dragState.lastPointerAngle,
				angle,
				fullTurn
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
			const angle = getPointerAngle(
				rect,
				event.clientX,
				event.clientY,
				fullTurn
			);
			// Picks the angle a click points at that is nearest the current
			// value, so a click never jumps a whole turn.
			const unclampedValue = wraps
				? angle
				: getNearestEquivalent( angle, referenceValue, fullTurn );
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
					nextValue = stepBy( increment );
					break;
				case 'ArrowDown':
				case 'ArrowLeft':
					nextValue = stepBy( -increment );
					break;
				case 'PageUp':
					nextValue = stepBy( largeStep );
					break;
				case 'PageDown':
					nextValue = stepBy( -largeStep );
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
					'aria-valuetext': getAriaValueText
						? getAriaValueText( value )
						: getDefaultAriaValueText( value, unit ),
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
							style={ {
								transform: `rotate(${ value }${ unit })`,
							} }
						/>
					),
				},
				interactionProps,
				restProps
			),
		} );
	}
);
