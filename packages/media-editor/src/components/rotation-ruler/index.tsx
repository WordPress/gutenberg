/**
 * External dependencies
 */
import clsx from 'clsx';
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
	/** Current value. */
	value: number;
	/** Called with the next value on each change. */
	onChange: ( value: number ) => void;
	/** Lower bound of the range. Default: -45. */
	min?: number;
	/** Upper bound of the range. Default: 45. */
	max?: number;
	/**
	 * Value step for drag and keyboard arrows. Default: 1. Drag values
	 * are quantized to multiples of `step`. Holding Shift during drag
	 * or with arrow keys halves the step for precision adjustment.
	 */
	step?: number;
	/** Accessible label for the slider input. */
	label: string;
	/**
	 * Unit suffix shown in the active label and `aria-valuetext`.
	 * Default: `°`.
	 */
	unit?: string;
	/** CSS pixels of pointer travel per `step`. Default: 6. */
	pixelsPerStep?: number;
	/** Optional extra class for the wrapper. */
	className?: string;
	/**
	 * Optional id for the underlying input; auto-generated when
	 * omitted.
	 */
	id?: string;
	/** When true, ignores all input. */
	disabled?: boolean;
}

const STRIP_HEIGHT = 32;
const LABEL_BASELINE_Y = 11;
const MAJOR_INTERVAL = 15;
const TICK_HEIGHT_MINOR = 4;
const TICK_HEIGHT_MID = 8;
const TICK_HEIGHT_MAJOR = 14;

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
			let height = TICK_HEIGHT_MINOR;
			if ( v % 15 === 0 ) {
				kind = 'major';
				height = TICK_HEIGHT_MAJOR;
			} else if ( v % 5 === 0 ) {
				kind = 'mid';
				height = TICK_HEIGHT_MID;
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
 * @param props Component props. See `RotationRulerProps`.
 */
export default function RotationRuler( props: RotationRulerProps ) {
	const {
		value,
		onChange,
		min = -45,
		max = 45,
		step = 1,
		label,
		unit = '°',
		pixelsPerStep = 6,
		className,
		id,
		disabled = false,
	} = props;
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
		disabled,
		onPointerDownStart: () => inputRef.current?.focus(),
	} );

	const handleKeyDown = ( event: KeyboardEvent< HTMLInputElement > ) => {
		// WAI-ARIA slider keyboard pattern: Up/Right increment,
		// Down/Left decrement. Home / End / PageUp / PageDown fall
		// through to native input.
		const isIncrement =
			event.key === 'ArrowRight' || event.key === 'ArrowUp';
		const isDecrement =
			event.key === 'ArrowLeft' || event.key === 'ArrowDown';
		if ( ! isIncrement && ! isDecrement ) {
			return;
		}
		// Always prevent default so the native input's own arrow-key
		// stepping doesn't double-fire `onChange` after our custom emit.
		event.preventDefault();
		if ( disabled ) {
			return;
		}
		const direction = isIncrement ? 1 : -1;
		// Shift halves the step for precision adjustment
		// (e.g. 0.5° rotation when step is 1°). Same modifier works
		// on drag — see `useRulerDrag`.
		const magnitude = event.shiftKey ? step / 2 : step;
		const next = clampValue( value + direction * magnitude, min, max );
		if ( next !== value ) {
			onChange( next );
		}
	};

	const display = `${ formatValue( value ) }${ unit }`;
	const ticks = useTicks( min, max );
	// Visual scale is locked to the gesture: 1 step of pointer travel
	// (`pixelsPerStep`) maps to `step` value units, so 1 value unit
	// renders at `pixelsPerStep / step` CSS pixels. This keeps the
	// ticks moving in lock-step with the pointer no matter what the
	// caller chooses for `pixelsPerStep` and `step`.
	const pxPerUnit = pixelsPerStep / step;
	// `left: 50%` puts the SVG's left edge at the strip's centerline, so
	// without an additional `-50%` self-offset all ticks would render to
	// the right of the pointer. Combine the centering offset with the
	// value-driven offset so value=0 lands the SVG's center on the
	// pointer.
	const stripStyle: CSSProperties = useMemo( () => {
		const offset = -value * pxPerUnit;
		return {
			transform: `translateX(calc(-50% + ${ offset }px))`,
		};
	}, [ value, pxPerUnit ] );

	// Closest major (every 15°) to current value. Its normal label is
	// suppressed and replaced by the active label, which sits exactly
	// under the pointer and shows the precise current value when off-
	// major (e.g. "-7°") or the major itself when on-major (e.g. "0°").
	const closestMajor = Math.round( value / MAJOR_INTERVAL ) * MAJOR_INTERVAL;
	const onMajor = Math.abs( value - closestMajor ) < 0.01;
	// Split the number into sign + digits so the sign is rendered in a
	// separate span and excluded from the active label's centering, the
	// same way the unit is.
	const numberText = onMajor ? `${ closestMajor }` : formatValue( value );
	const isNegative = numberText.startsWith( '-' );
	const digits = isNegative ? numberText.slice( 1 ) : numberText;
	const majorTicks = ticks.filter( ( tick ) => tick.kind === 'major' );

	return (
		<div
			className={ clsx( 'rotation-ruler', className ) }
			role="presentation"
			data-disabled={ disabled || undefined }
			{ ...dragHandlers }
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
			<div className="rotation-ruler__strip" aria-hidden="true">
				<svg
					className="rotation-ruler__ticks"
					style={ stripStyle }
					width={ ( max - min ) * pxPerUnit }
					height={ STRIP_HEIGHT }
					viewBox={ `${ min * pxPerUnit } 0 ${
						( max - min ) * pxPerUnit
					} ${ STRIP_HEIGHT }` }
					preserveAspectRatio="xMidYMid meet"
				>
					{ ticks.map( ( tick ) => (
						<line
							key={ tick.value }
							x1={ tick.value * pxPerUnit }
							x2={ tick.value * pxPerUnit }
							y1={ STRIP_HEIGHT - tick.height }
							y2={ STRIP_HEIGHT }
							className={ `rotation-ruler__tick rotation-ruler__tick--${ tick.kind }` }
						/>
					) ) }
					{ majorTicks.map( ( tick ) => (
						<text
							key={ tick.value }
							x={ tick.value * pxPerUnit }
							y={ LABEL_BASELINE_Y }
							textAnchor="middle"
							className="rotation-ruler__label"
						>
							{ tick.value }
							{ unit }
						</text>
					) ) }
				</svg>
			</div>
			<div className="rotation-ruler__active-label" aria-hidden="true">
				<span className="rotation-ruler__active-label-number">
					{ isNegative && (
						<span className="rotation-ruler__active-label-sign">
							-
						</span>
					) }
					{ digits }
					<span className="rotation-ruler__active-label-unit">
						{ unit }
					</span>
				</span>
			</div>
			<div className="rotation-ruler__pointer" aria-hidden="true" />
		</div>
	);
}
