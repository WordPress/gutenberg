/**
 * External dependencies
 */
import type { PointerEvent } from 'react';
import { useEffect, useRef, useState } from '@wordpress/element';
import { HsvColorPicker, HsvaColorPicker } from 'react-colorful';
import { colord } from 'colord';
import type { HsvaColor } from 'react-colorful';

/**
 * Internal dependencies
 */
import type { PickerProps } from './types';

function getPointerCaptureProps( {
	onInteractionStart,
	onInteractionEnd,
}: {
	onInteractionStart?: () => void;
	onInteractionEnd?: () => void;
} ) {
	return {
		onPointerDown( { currentTarget, pointerId }: PointerEvent ) {
			onInteractionStart?.();
			currentTarget.setPointerCapture( pointerId );
		},
		onPointerUp( { currentTarget, pointerId }: PointerEvent ) {
			currentTarget.releasePointerCapture( pointerId );
			onInteractionEnd?.();
		},
		onPointerCancel( { currentTarget, pointerId }: PointerEvent ) {
			currentTarget.releasePointerCapture( pointerId );
			onInteractionEnd?.();
		},
	};
}

function toHsva( hsla: PickerProps[ 'hsla' ] ): HsvaColor {
	return {
		...colord( hsla ).toHsv(),
		a: hsla.a,
	};
}

/**
 * Visual color surface.
 *
 * Uses HSVA (react-colorful's native model) and keeps that value in local
 * state while dragging so HSLA↔hex round-trips cannot move the pointer
 * Parent ColorPicker still speaks HSLA for
 * inputs and controlled value sync, conversion happens only at the boundary.
 */
export const Picker = ( {
	hsla,
	enableAlpha,
	onChange,
	onInteractionStart,
	onInteractionEnd,
}: PickerProps ) => {
	const [ hsva, setHsva ] = useState< HsvaColor >( () => toHsva( hsla ) );
	const isInteractingRef = useRef( false );

	// Sync from parent HSLA only when not dragging (HSL inputs / external).
	useEffect( () => {
		if ( isInteractingRef.current ) {
			return;
		}
		setHsva( toHsva( hsla ) );
	}, [ hsla ] );

	const pointerCaptureProps = getPointerCaptureProps( {
		onInteractionStart: () => {
			isInteractingRef.current = true;
			onInteractionStart?.();
		},
		onInteractionEnd: () => {
			isInteractingRef.current = false;
			onInteractionEnd?.();
		},
	} );

	const handleChange = ( next: HsvaColor ) => {
		setHsva( next );
		const nextHsl = colord( next ).toHsl();
		onChange( { ...nextHsl, a: next.a } );
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

	return (
		<HsvColorPicker
			color={ hsva }
			onChange={ ( next ) => {
				handleChange( { ...next, a: hsla.a } );
			} }
			{ ...pointerCaptureProps }
		/>
	);
};
