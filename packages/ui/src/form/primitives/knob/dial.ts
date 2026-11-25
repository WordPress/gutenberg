export function modulo( value: number, period: number ) {
	return ( ( value % period ) + period ) % period;
}

export function clamp( value: number, min: number, max: number ) {
	return Math.max( min, Math.min( max, value ) );
}

function decimalPlaces( value: number ) {
	const [ coefficient, exponent ] = value.toExponential().split( 'e' );
	const fractionLength = coefficient.split( '.' )[ 1 ]?.length ?? 0;
	return Math.max( 0, fractionLength - Number( exponent ) );
}

function positive( value: number | undefined, fallback: number ) {
	return value !== undefined && Number.isFinite( value ) && value > 0
		? value
		: fallback;
}

// Maps the selectable values to whole steps and to angles on the dial.
//
// Without bounds, the values cover one turn and repeat. Zero and a full turn
// share a heading, so the last step is the one before a full turn. With bounds,
// the steps start at `min` and the dial counts turns between `min` and `max`.
export function getDial( {
	min,
	max,
	step: stepProp,
	unitsPerTurn: unitsPerTurnProp,
}: {
	min?: number;
	max?: number;
	step?: number;
	unitsPerTurn?: number;
} ) {
	const unitsPerTurn = positive( unitsPerTurnProp, 360 );
	const step = positive( stepProp, 1 );
	const wraps = min === undefined || max === undefined;
	const first = wraps ? 0 : min;
	const precision = Math.min(
		100,
		Math.max( decimalPlaces( first ), decimalPlaces( step ) )
	);
	const toValue = ( index: number ) =>
		Number( ( first + index * step ).toFixed( precision ) ) || 0;
	const upperStep = Math.ceil(
		( wraps ? unitsPerTurn : max - first ) / step
	);
	const fits = wraps
		? toValue( upperStep ) < unitsPerTurn
		: toValue( upperStep ) <= max;
	const lastStep = Math.max( 0, fits ? upperStep : upperStep - 1 );
	const degreesPerStep = ( step / unitsPerTurn ) * 360;
	const firstAngle = ( first / unitsPerTurn ) * 360;

	return {
		wraps,
		step,
		precision,
		lastStep,
		degreesPerStep,
		firstAngle,
		lastAngle: firstAngle + lastStep * degreesPerStep,
		toValue,
		toIndex: ( value: number ) =>
			wraps
				? modulo(
						Math.round( modulo( value, unitsPerTurn ) / step ),
						lastStep + 1
					)
				: clamp( Math.round( ( value - first ) / step ), 0, lastStep ),
		toAngle: ( index: number ) => firstAngle + index * degreesPerStep,
	};
}

// The clockwise angle of the pointer from twelve o'clock, between -180 and 180
// degrees.
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
	largeStepCount: number,
	rtl: boolean
) {
	const increment = event.shiftKey ? largeStepCount : 1;
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
			return largeStepCount;
		case 'PageDown':
			return -largeStepCount;
	}
	return 0;
}
