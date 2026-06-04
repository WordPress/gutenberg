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
 * Round `value` to the nearest multiple of `step`.
 *
 * @param value Value to quantize.
 * @param step  Step granularity (must be > 0).
 */
export function quantize( value: number, step: number ): number {
	return Math.round( value / step ) * step;
}

export interface UseRulerDragOptions {
	value: number;
	onChange: ( next: number ) => void;
	min: number;
	max: number;
	step: number;
	pixelsPerStep: number;
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
 * movement into value changes quantized to `step`; the caller renders
 * the visuals and holds the value.
 *
 * The hook owns no state of its own — every value change is reported
 * through the supplied `onChange`. The "current value" is read from a
 * ref so closure staleness during a drag is impossible. Drag continues
 * past the wrapper's bounds (standard slider behaviour); a window-level
 * `pointerup` listener guarantees the drag ends and pointer capture
 * releases even if the underlying captured event never fires on the
 * wrapper.
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
		disabled,
		onPointerDownStart,
	} = options;

	// Mutable mirror of the latest committed value plus per-drag state.
	// Pointermove handlers fire far faster than React commits, so we
	// cannot read `value` from closure. The `value` write happens in an
	// effect (not at render time) to satisfy `react-hooks/refs`; the
	// effect flushes after commit, so by the time any pointer handler
	// runs, the ref reflects the latest committed `value`.
	const latestRef = useRef< {
		value: number;
		startX: number;
		startValue: number;
		activeStep: number;
		dragging: boolean;
		captureElement: HTMLElement | null;
		capturePointerId: number;
		windowPointerUp: ( () => void ) | null;
	} >( {
		value,
		startX: 0,
		startValue: 0,
		activeStep: step,
		dragging: false,
		captureElement: null,
		capturePointerId: 0,
		windowPointerUp: null,
	} );
	useEffect( () => {
		latestRef.current.value = value;
	}, [ value ] );

	const endDrag = useCallback( () => {
		const state = latestRef.current;
		if ( ! state.dragging ) {
			return;
		}
		state.dragging = false;
		if (
			state.captureElement &&
			state.captureElement.hasPointerCapture( state.capturePointerId )
		) {
			state.captureElement.releasePointerCapture(
				state.capturePointerId
			);
		}
		state.captureElement = null;
		if ( state.windowPointerUp ) {
			window.removeEventListener( 'pointerup', state.windowPointerUp );
			window.removeEventListener(
				'pointercancel',
				state.windowPointerUp
			);
			state.windowPointerUp = null;
		}
	}, [] );

	// Cleanup any in-flight drag on unmount so we never leak window
	// listeners or stale pointer capture.
	useEffect( () => endDrag, [ endDrag ] );

	const onPointerDown = useCallback(
		( event: React.PointerEvent< HTMLElement > ) => {
			if ( disabled || event.button !== 0 ) {
				return;
			}
			const state = latestRef.current;
			event.currentTarget.setPointerCapture( event.pointerId );
			state.captureElement = event.currentTarget;
			state.capturePointerId = event.pointerId;
			state.startX = event.clientX;
			state.startValue = state.value;
			state.activeStep = event.shiftKey ? step / 2 : step;
			state.dragging = true;
			onPointerDownStart?.();

			// Window-level backstop. With `setPointerCapture`, the
			// element should always receive `pointerup` even when the
			// cursor is released outside its bounds — but in practice
			// some browsers / window-blur sequences drop the event. The
			// window listener guarantees the drag ends and capture
			// releases.
			const onWindowUp = () => endDrag();
			state.windowPointerUp = onWindowUp;
			window.addEventListener( 'pointerup', onWindowUp );
			window.addEventListener( 'pointercancel', onWindowUp );
		},
		[ disabled, onPointerDownStart, endDrag, step ]
	);

	const onPointerMove = useCallback(
		( event: React.PointerEvent< HTMLElement > ) => {
			const state = latestRef.current;
			if ( ! state.dragging ) {
				return;
			}
			// Shift toggles fine mode mid-drag. The drag math computes
			// from `startX` / `startValue`, so naively swapping `step`
			// would yank the value backward. Rebase to the current
			// pointer + value so the granularity changes without a
			// jump.
			const requestedStep = event.shiftKey ? step / 2 : step;
			if ( requestedStep !== state.activeStep ) {
				state.startX = event.clientX;
				state.startValue = state.value;
				state.activeStep = requestedStep;
			}
			const deltaPx = event.clientX - state.startX;
			const deltaValue = pxToValueDelta(
				deltaPx,
				pixelsPerStep,
				state.activeStep
			);
			const raw = state.startValue + deltaValue;
			const stepped = quantize( raw, state.activeStep );
			const next = clampValue( stepped, min, max );
			if ( next !== state.value ) {
				// Update the ref synchronously so consecutive pointermove
				// events that fire before React commits still see the
				// last *emitted* value as `previous` for the next math.
				state.value = next;
				onChange( next );
			}
		},
		[ onChange, min, max, step, pixelsPerStep ]
	);

	return {
		onPointerDown,
		onPointerMove,
		onPointerUp: endDrag,
		onPointerCancel: endDrag,
	};
}
