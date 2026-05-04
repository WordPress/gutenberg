/**
 * External dependencies
 */
import type { CSSProperties, KeyboardEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useId, useMemo, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useRulerDrag, clampValue } from './use-ruler-drag';

export interface RotationRulerProps {
	value: number;
	onChange: ( value: number ) => void;
	min?: number;
	max?: number;
	step?: number;
	label: string;
	unit?: string;
	pixelsPerStep?: number;
	snapToZeroWithin?: number;
	className?: string;
	id?: string;
	disabled?: boolean;
}

const PX_PER_UNIT = 6;

type TickKind = 'minor' | 'mid' | 'major';
interface Tick {
	value: number;
	kind: TickKind;
	height: number;
}

/**
 * Build the tick list for the ruler strip.
 *
 * @param min Lower bound of the ruler in value units.
 * @param max Upper bound of the ruler in value units.
 */
function useTicks( min: number, max: number ): Tick[] {
	return useMemo( () => {
		const out: Tick[] = [];
		for ( let v = Math.ceil( min ); v <= Math.floor( max ); v += 1 ) {
			let kind: TickKind = 'minor';
			let height = 6;
			if ( v % 15 === 0 ) {
				kind = 'major';
				height = 18;
			} else if ( v % 5 === 0 ) {
				kind = 'mid';
				height = 12;
			}
			out.push( { value: v, kind, height } );
		}
		return out;
	}, [ min, max ] );
}

/**
 * Format a numeric ruler value for display, trimming a trailing `.0`.
 *
 * @param value Value to format.
 */
function formatValue( value: number ): string {
	const rounded = Math.round( value * 10 ) / 10;
	return Number.isInteger( rounded )
		? rounded.toFixed( 0 )
		: rounded.toFixed( 1 );
}

/**
 * Horizontal "scrub-the-ruler" slider for fine-grained numeric input
 * such as rotation in degrees.
 *
 * Renders a visually hidden `<input type="range">` for assistive
 * technologies and keyboard input alongside a decorative tick strip
 * that the user can drag with a pointer.
 *
 * @param props                  Component props.
 * @param props.value            Current value.
 * @param props.onChange         Called with the next value on each change.
 * @param props.min              Lower bound of the range (default: -45).
 * @param props.max              Upper bound of the range (default: 45).
 * @param props.step             Value step for keyboard arrows (default: 1).
 * @param props.label            Accessible label for the slider input.
 * @param props.unit             Unit suffix shown in the bubble and
 *                               `aria-valuetext` (default: `°`).
 * @param props.pixelsPerStep    CSS pixels of pointer travel per `step`
 *                               (default: 6).
 * @param props.snapToZeroWithin Half-width of the zero snap window in
 *                               value units. 0 disables snapping
 *                               (default: 0.75).
 * @param props.className        Optional extra class for the wrapper.
 * @param props.id               Optional id for the underlying input;
 *                               auto-generated when omitted.
 * @param props.disabled         When true, ignores all input.
 */
export default function RotationRuler( {
	value,
	onChange,
	min = -45,
	max = 45,
	step = 1,
	label,
	unit = '°',
	pixelsPerStep = 6,
	snapToZeroWithin = 0.75,
	className,
	id,
	disabled = false,
}: RotationRulerProps ) {
	const inputRef = useRef< HTMLInputElement >( null );
	const generatedId = useId();
	const inputId = id ?? generatedId;

	const dragHandlers = useRulerDrag( {
		value,
		onChange,
		min,
		max,
		step,
		pixelsPerStep,
		snapToZeroWithin,
		disabled,
		onPointerDownStart: () => inputRef.current?.focus(),
	} );

	const handleKeyDown = ( event: KeyboardEvent< HTMLInputElement > ) => {
		if ( event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' ) {
			// Home / End / PageUp / PageDown fall through to native input.
			return;
		}
		// Always prevent default so the native input's own arrow-key
		// stepping doesn't double-fire `onChange` after our custom emit.
		event.preventDefault();
		if ( disabled ) {
			return;
		}
		const direction = event.key === 'ArrowRight' ? 1 : -1;
		const magnitude = event.shiftKey ? step / 2 : step;
		const next = clampValue( value + direction * magnitude, min, max );
		if ( next !== value ) {
			onChange( next );
		}
	};

	const display = `${ formatValue( value ) }${ unit }`;
	const ticks = useTicks( min, max );
	const stripStyle: CSSProperties = useMemo( () => {
		const offset = -value * PX_PER_UNIT;
		return { transform: `translateX(${ offset }px)` };
	}, [ value ] );

	const wrapperClassName = [ 'rotation-ruler', className ]
		.filter( Boolean )
		.join( ' ' );

	return (
		<div
			className={ wrapperClassName }
			role="presentation"
			data-disabled={ disabled || undefined }
		>
			<input
				ref={ inputRef }
				id={ inputId }
				type="range"
				className="rotation-ruler__input"
				min={ min }
				max={ max }
				step="any"
				value={ value }
				disabled={ disabled }
				aria-label={ label }
				aria-valuetext={ display }
				onChange={ ( event ) =>
					onChange(
						clampValue( event.target.valueAsNumber, min, max )
					)
				}
				onKeyDown={ handleKeyDown }
			/>
			<div
				className="rotation-ruler__strip"
				aria-hidden="true"
				{ ...dragHandlers }
			>
				<svg
					className="rotation-ruler__ticks"
					style={ stripStyle }
					width={ ( max - min ) * PX_PER_UNIT }
					height="32"
					viewBox={ `${ min * PX_PER_UNIT } 0 ${
						( max - min ) * PX_PER_UNIT
					} 32` }
					preserveAspectRatio="xMidYMid meet"
				>
					{ ticks.map( ( tick ) => (
						<line
							key={ tick.value }
							x1={ tick.value * PX_PER_UNIT }
							x2={ tick.value * PX_PER_UNIT }
							y1={ 32 - tick.height }
							y2={ 32 }
							className={ `rotation-ruler__tick rotation-ruler__tick--${ tick.kind }` }
						/>
					) ) }
				</svg>
			</div>
			<div className="rotation-ruler__pointer" aria-hidden="true" />
			<div className="rotation-ruler__bubble" aria-hidden="true">
				{ display }
			</div>
		</div>
	);
}
