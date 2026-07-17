/**
 * External dependencies
 */
import type { PointerEvent } from 'react';
import { useEffect, useRef, useState } from '@wordpress/element';
import { HsvColorPicker, HsvaColorPicker } from 'react-colorful';
import { colord } from 'colord';
import type { HslaColor, HsvaColor } from 'react-colorful';

/**
 * Internal dependencies
 */
import type { PickerProps } from './types';

function toHsva( hsla: PickerProps[ 'hsla' ] ): HsvaColor {
	return {
		...colord( hsla ).toHsv(),
		a: hsla.a,
	};
}

function isSameHsla( a: HslaColor, b: HslaColor ): boolean {
	return a.h === b.h && a.s === b.s && a.l === b.l && a.a === b.a;
}

/**
 * Visual color surface.
 *
 * Uses HSVA (react-colorful's native model) and keeps that value in local
 * state so HSLA↔hex round-trips cannot move the pointer
 * (#80110, #75157, #80205). Parent ColorPicker still speaks HSLA for
 * inputs and controlled value sync; conversion happens only at the boundary.
 *
 * Prop sync from parent HSLA is suppressed for:
 * - pointer/touch drags (interaction flag), and
 * - any picker-originated update including keyboard (HSLA origin token).
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
	// Pointer/touch drag: never sync from HSLA mid-gesture (origin match alone
	// can fail across rapid frames when parent gradient state re-renders).
	const isPointerInteractingRef = useRef( false );

	useEffect( () => {
		if ( isPointerInteractingRef.current ) {
			return;
		}
		if (
			pickerOriginHslaRef.current &&
			isSameHsla( pickerOriginHslaRef.current, hsla )
		) {
			return;
		}
		pickerOriginHslaRef.current = null;
		setHsva( toHsva( hsla ) );
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
