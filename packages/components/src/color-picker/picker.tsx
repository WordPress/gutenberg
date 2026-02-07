/**
 * External dependencies
 */
import { HsvColorPicker, HsvaColorPicker } from 'react-colorful';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useMemo, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { PickerProps } from './types';

/**
 * Checks whether an HSV color carries meaningful chromatic information.
 * Achromatic colors (very low saturation or value near zero) report
 * hue as 0 after hex round-tripping, so their hue is unreliable.
 */
function isChromatic( hsv: { s: number; v: number } ): boolean {
	return hsv.s >= 1 && hsv.v >= 1;
}

export const Picker = ( { color, enableAlpha, onChange }: PickerProps ) => {
	const Component = enableAlpha ? HsvaColorPicker : HsvColorPicker;

	// Preserve the last meaningful hue to prevent it resetting to 0 (red)
	// when the color reaches achromatic points (pure black, white, or gray).
	//
	// This is needed because the parent component stores color as hex, which
	// discards hue for achromatic colors (e.g. #000000 → hsv(0, 0%, 0%)).
	// By feeding the preserved hue into react-colorful's HSV picker — which
	// uses HSVA as its native model — the hue slider stays stable with no
	// intermediate conversion.
	//
	// This is the standard approach used by Figma, Photoshop, react-colorful
	// itself, and other professional color pickers.
	const preservedHueRef = useRef( color.toHsv().h );

	// Cache the last HSV we produced and the corresponding hex to avoid
	// precision jitter during dragging. Without this, the HSV→hex→HSV
	// round-trip through the parent can produce slightly different values,
	// causing the thumb to shift on re-render.
	const lastHsvRef = useRef< {
		h: number;
		s: number;
		v: number;
		a: number;
	} | null >( null );
	const lastHexRef = useRef( '' );

	// Note: this useMemo intentionally reads and writes refs for hue
	// preservation and jitter avoidance. This is an accepted trade-off
	// since the ref updates are synchronous and idempotent — the same
	// input color will always produce the same ref values.
	const hsvColor = useMemo( () => {
		const currentHex = color.toHex();

		// If the hex matches what we last emitted, return the cached HSV
		// to avoid floating-point precision drift from hex → HSV conversion.
		if ( lastHsvRef.current && currentHex === lastHexRef.current ) {
			return lastHsvRef.current;
		}

		// External change — parse from hex and preserve hue if chromatic.
		const hsv = color.toHsv();

		if ( isChromatic( hsv ) ) {
			preservedHueRef.current = hsv.h;
		}

		const result = {
			h: preservedHueRef.current,
			s: hsv.s,
			v: hsv.v,
			a: hsv.a,
		};

		lastHsvRef.current = result;
		lastHexRef.current = currentHex;

		return result;
	}, [ color ] );

	return (
		<Component
			color={ hsvColor }
			onChange={ ( nextHsv ) => {
				if ( isChromatic( nextHsv ) ) {
					preservedHueRef.current = nextHsv.h;
				}

				const nextColord = colord( nextHsv );

				// Cache the HSV and hex to prevent jitter on re-render.
				lastHsvRef.current = {
					h: isChromatic( nextHsv )
						? nextHsv.h
						: preservedHueRef.current,
					s: nextHsv.s,
					v: nextHsv.v,
					a: 'a' in nextHsv ? nextHsv.a : 1,
				};
				lastHexRef.current = nextColord.toHex();

				onChange( nextColord );
			} }
		/>
	);
};
