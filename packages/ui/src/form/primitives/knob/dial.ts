// A gap at the bottom gives a bounded dial two distinct end stops.
export const BOUNDED_SWEEP = 270;

export function modulo( value: number, period: number ) {
	return ( ( value % period ) + period ) % period;
}

export function clamp( value: number, min: number, max: number ) {
	return Math.max( min, Math.min( max, value ) );
}

export function getAngleOnTurn(
	pointer: number,
	current: number,
	min: number,
	max: number,
	wrap: boolean
) {
	const nearest = pointer + 360 * Math.round( ( current - pointer ) / 360 );
	if ( wrap || ( nearest >= min && nearest <= max ) ) {
		return nearest;
	}
	// At an end stop the adjacent turn may still contain the clicked angle.
	// If neither turn does, select the stop closest to the pointer.
	const adjacent = nearest + ( nearest < min ? 360 : -360 );
	const stop = clamp( nearest, min, max );
	const adjacentStop = clamp( adjacent, min, max );
	return Math.abs( nearest - stop ) <= Math.abs( adjacent - adjacentStop )
		? stop
		: adjacentStop;
}

export function getPointerAngle( event: React.PointerEvent< HTMLElement > ) {
	const { left, top, width, height } =
		event.currentTarget.getBoundingClientRect();
	const x = event.clientX - left - width / 2;
	const y = event.clientY - top - height / 2;
	// There is no meaningful angle at the center of the dial.
	if ( Math.hypot( x, y ) < Math.min( width, height ) / 8 ) {
		return null;
	}
	return ( Math.atan2( x, -y ) * 180 ) / Math.PI;
}

export function getStepChange(
	event: React.KeyboardEvent,
	step: number,
	largeStep: number,
	rtl: boolean
) {
	const increment = event.shiftKey ? largeStep : step;
	switch ( event.key ) {
		case 'ArrowUp':
			return increment;
		case 'ArrowDown':
			return -increment;
		case 'ArrowRight':
			return rtl ? -increment : increment;
		case 'ArrowLeft':
			return rtl ? increment : -increment;
		case 'PageUp':
			return largeStep;
		case 'PageDown':
			return -largeStep;
	}
	return 0;
}
