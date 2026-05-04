/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Convert a horizontal pointer delta (px) into a value delta.
 *
 * Negative because dragging the ruler to the right should expose
 * smaller values to the left of the fixed center pointer (and vice
 * versa) — the ruler scrubs *under* the pointer.
 *
 * @param deltaPx       Pointer movement in CSS pixels.
 * @param pixelsPerStep CSS pixels of pointer travel per `step`.
 * @param step          Value units per step.
 */
export function pxToValueDelta(
	deltaPx: number,
	pixelsPerStep: number,
	step: number
): number {
	return ( -deltaPx / pixelsPerStep ) * step;
}

/**
 * Clamp `value` to the inclusive `[min, max]` interval.
 *
 * @param value Value to clamp.
 * @param min   Lower bound (inclusive).
 * @param max   Upper bound (inclusive).
 */
export function clampValue( value: number, min: number, max: number ): number {
	if ( value < min ) {
		return min;
	}
	if ( value > max ) {
		return max;
	}
	return value;
}

/**
 * Snap `next` to 0 only when entering the snap window from outside.
 *
 * Avoids a "sticky zero" while scrubbing through 0; the user gets a
 * single satisfying snap on entry, then is free to leave.
 *
 * @param next       Computed next value.
 * @param previous   Previous value (last emitted).
 * @param windowSize Half-width of the snap window in value units. 0
 *                   disables snapping.
 */
export function applyZeroSnap(
	next: number,
	previous: number,
	windowSize: number
): number {
	if ( windowSize <= 0 ) {
		return next;
	}
	const enteringWindow =
		Math.abs( next ) < windowSize && Math.abs( previous ) >= windowSize;
	return enteringWindow ? 0 : next;
}

export interface UseRulerDragOptions {
	value: number;
	onChange: ( next: number ) => void;
	min: number;
	max: number;
	step: number;
	pixelsPerStep: number;
	snapToZeroWithin: number;
	disabled: boolean;
	/** Called once on pointerdown so the caller can focus the input. */
	onPointerDownStart?: () => void;
}

export interface RulerDragHandlers {
	onPointerDown: ( event: React.PointerEvent< HTMLElement > ) => void;
	onPointerMove: ( event: React.PointerEvent< HTMLElement > ) => void;
	onPointerUp: ( event: React.PointerEvent< HTMLElement > ) => void;
	onPointerCancel: ( event: React.PointerEvent< HTMLElement > ) => void;
}

/**
 * Drag-the-ruler gesture for a horizontal slider. Translates pointer
 * movement into value changes; the caller renders the visuals and
 * holds the value.
 *
 * The hook owns no state of its own — every value change is reported
 * through the supplied `onChange`. The "current value" is read from a
 * ref so closure staleness during a drag is impossible.
 *
 * @param options Ruler-drag configuration. See `UseRulerDragOptions`.
 */
export function useRulerDrag(
	options: UseRulerDragOptions
): RulerDragHandlers {
	const {
		value,
		onChange,
		min,
		max,
		step,
		pixelsPerStep,
		snapToZeroWithin,
		disabled,
		onPointerDownStart,
	} = options;

	// Mutable mirror of the latest committed value. Pointermove handlers
	// fire far faster than React commits, so we cannot read `value` from
	// closure. Writes happen in an effect (not at render time) to satisfy
	// `react-hooks/refs`; the effect flushes after commit, so by the time
	// any pointer handler runs, the ref reflects the latest committed
	// `value`.
	const latestRef = useRef( {
		value,
		startX: 0,
		startValue: 0,
		dragging: false,
	} );
	useEffect( () => {
		latestRef.current.value = value;
	}, [ value ] );

	const onPointerDown = useCallback(
		( event: React.PointerEvent< HTMLElement > ) => {
			if ( disabled || event.button !== 0 ) {
				return;
			}
			event.currentTarget.setPointerCapture( event.pointerId );
			latestRef.current.startX = event.clientX;
			latestRef.current.startValue = latestRef.current.value;
			latestRef.current.dragging = true;
			onPointerDownStart?.();
		},
		[ disabled, onPointerDownStart ]
	);

	const onPointerMove = useCallback(
		( event: React.PointerEvent< HTMLElement > ) => {
			if ( ! latestRef.current.dragging ) {
				return;
			}
			const deltaPx = event.clientX - latestRef.current.startX;
			const deltaValue = pxToValueDelta( deltaPx, pixelsPerStep, step );
			const raw = latestRef.current.startValue + deltaValue;
			const snapped = applyZeroSnap(
				raw,
				latestRef.current.value,
				snapToZeroWithin
			);
			const next = clampValue( snapped, min, max );
			if ( next !== latestRef.current.value ) {
				onChange( next );
			}
		},
		[ onChange, min, max, step, pixelsPerStep, snapToZeroWithin ]
	);

	const endDrag = useCallback(
		( event: React.PointerEvent< HTMLElement > ) => {
			if ( ! latestRef.current.dragging ) {
				return;
			}
			latestRef.current.dragging = false;
			if ( event.currentTarget.hasPointerCapture( event.pointerId ) ) {
				event.currentTarget.releasePointerCapture( event.pointerId );
			}
		},
		[]
	);

	return {
		onPointerDown,
		onPointerMove,
		onPointerUp: endDrag,
		onPointerCancel: endDrag,
	};
}
