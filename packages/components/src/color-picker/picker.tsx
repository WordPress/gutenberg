import type { PointerEvent } from 'react';
import { useEffect, useRef, useState } from '@wordpress/element';
import { HsvColorPicker, HsvaColorPicker } from 'react-colorful';
import { colord } from 'colord';
import type { HslaColor, HsvaColor } from 'react-colorful';
import type { PickerProps } from './types';

function toHsva( hsla: PickerProps[ 'hsla' ] ): HsvaColor {
	return {
		...colord( hsla ).toHsv(),
		// HSL and HSV share the hue angle. Color conversion collapses achromatic
		// hue to 0, but HSLA retains the user's latent hue.
		h: hsla.h,
		a: hsla.a,
	};
}

function isSameHsla( a: HslaColor, b: HslaColor ): boolean {
	return a.h === b.h && a.s === b.s && a.l === b.l && a.a === b.a;
}

/**
 * Convert parent HSLA into HSVA for prop sync.
 *
 * At black, RGB round-trips collapse saturation to 0. Preserve the native
 * HSVA saturation coordinate unless the HSL saturation channel itself
 * changed (sibling hue/alpha edits must not snap the pointer).
 *
 * At white, only `v: 100, s: 0` is visually white — preserving a prior
 * chromatic saturation would leave the pointer at the top-right and make
 * the first keyboard step jump from white to a saturated color.
 */
function toHsvaFromHsla(
	hsla: HslaColor,
	prevHsva: HsvaColor,
	prevHsla: HslaColor | null
): HsvaColor {
	const converted = toHsva( hsla );

	// White and chromatic colors use the converted value as-is.
	if ( hsla.l !== 0 ) {
		return converted;
	}

	const saturationChanged = prevHsla !== null && prevHsla.s !== hsla.s;

	return {
		h: hsla.h,
		s: saturationChanged ? hsla.s : prevHsva.s,
		v: 0,
		a: hsla.a,
	};
}

/**
 * Visual color surface.
 *
 * Uses HSVA (react-colorful's native model) and keeps that value in local
 * state so HSLA↔hex round-trips cannot move the pointer
 * Parent ColorPicker still speaks HSLA for
 * inputs and controlled value sync; conversion happens only at the boundary.
 *
 * Prop sync from parent HSLA is suppressed for:
 * - pointer/touch drags (interaction flag), and
 * - any picker-originated update including keyboard (HSLA origin token).
 *
 * Achromatic HSL sibling edits (hue/alpha while at black) preserve native
 * HSVA saturation unless saturation itself changed. White always syncs to
 * the converted `s: 0` visual coordinate.
 */
export const Picker = ( {
	hsla,
	enableAlpha,
	onChange,
	onInteractionStart,
	onInteractionEnd,
}: PickerProps ) => {
	const [ hsva, setHsva ] = useState< HsvaColor >( () => toHsva( hsla ) );
	// Last HSLA emitted by this picker — skip echoing it back into HSVA.
	const pickerOriginHslaRef = useRef< HslaColor | null >( null );
	// Previous parent HSLA — detect which channel changed on achromatic sync.
	const prevHslaRef = useRef< HslaColor >( hsla );
	// Pointer/touch drag: never sync from HSLA mid-gesture (origin match alone
	// can fail across rapid frames when parent gradient state re-renders).
	const isPointerInteractingRef = useRef( false );

	useEffect( () => {
		if ( isPointerInteractingRef.current ) {
			// Keep prevHsla in lockstep with parent updates during the gesture
			// so a post-drag HSL sibling edit is not compared against pre-drag
			// HSLA and mistaken for a saturation change.
			prevHslaRef.current = hsla;
			return;
		}
		if (
			pickerOriginHslaRef.current &&
			isSameHsla( pickerOriginHslaRef.current, hsla )
		) {
			prevHslaRef.current = hsla;
			return;
		}
		pickerOriginHslaRef.current = null;
		setHsva( ( prev ) =>
			toHsvaFromHsla( hsla, prev, prevHslaRef.current )
		);
		prevHslaRef.current = hsla;
	}, [ hsla ] );

	// Inline handlers so refs are not passed into a helper during render
	// (react-hooks/refs). Pointer capture also keeps drag working over iframes.
	const pointerCaptureProps = {
		onPointerDown( { currentTarget, pointerId }: PointerEvent ) {
			isPointerInteractingRef.current = true;
			onInteractionStart?.();
			currentTarget.setPointerCapture( pointerId );
		},
		onPointerUp( { currentTarget, pointerId }: PointerEvent ) {
			currentTarget.releasePointerCapture( pointerId );
			isPointerInteractingRef.current = false;
			onInteractionEnd?.();
		},
		onPointerCancel( { currentTarget, pointerId }: PointerEvent ) {
			currentTarget.releasePointerCapture( pointerId );
			isPointerInteractingRef.current = false;
			onInteractionEnd?.();
		},
	};

	const handleChange = ( next: HsvaColor ) => {
		setHsva( next );
		const nextHsla: HslaColor = { ...colord( next ).toHsl(), a: next.a };
		pickerOriginHslaRef.current = nextHsla;
		onChange( nextHsla );
	};

	if ( enableAlpha ) {
		return (
			<HsvaColorPicker
				color={ hsva }
				onChange={ handleChange }
				{ ...pointerCaptureProps }
			/>
		);
	}

	// HsvColorPicker's equality checks enumerate own keys — never pass `a`,
	// or every parent re-render looks like an external color change and the
	// pointer jitters while dragging.
	const hsv = { h: hsva.h, s: hsva.s, v: hsva.v };

	return (
		<HsvColorPicker
			color={ hsv }
			onChange={ ( next ) => {
				handleChange( { ...next, a: hsva.a } );
			} }
			{ ...pointerCaptureProps }
		/>
	);
};
