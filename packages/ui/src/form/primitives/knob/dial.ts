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
	const wraps = min === undefined || max === undefined;
	const first = wraps ? 0 : min;
	const span = wraps ? unitsPerTurn : max - first;
	// By default, the largest power of ten that gives a turn at least 100
	// steps: 1 for degrees and gradians, 0.01 for radians and turns.
	const defaultStep = 10 ** Math.floor( Math.log10( unitsPerTurn / 100 ) );
	const requestedStep = positive( stepProp, defaultStep );
	// A step too small to count, or too large to leave a second value, falls
	// back to the default.
	const step =
		requestedStep < span && span / requestedStep <= Number.MAX_SAFE_INTEGER
			? requestedStep
			: defaultStep;
	const precision = Math.min(
		100,
		Math.max( decimalPlaces( first ), decimalPlaces( step ) )
	);
	const toValue = ( index: number ) =>
		Number( ( first + index * step ).toFixed( precision ) ) || 0;
	// Division can land a hair above a whole number, so step back from the
	// first candidate to the last step that fits. Two tries cover the error.
	let lastStep = Math.max( 0, Math.ceil( span / step ) );
	for ( let tries = 0; tries < 2 && lastStep > 0; tries++ ) {
		const fits = wraps
			? toValue( lastStep ) < unitsPerTurn
			: toValue( lastStep ) <= max;
		if ( fits ) {
			break;
		}
		lastStep--;
	}
	// Angles come from the rounded values, so an end at zero is exactly zero.
	const toAngle = ( index: number ) =>
		( toValue( index ) / unitsPerTurn ) * 360;

	function toIndex( value: number ) {
		if ( ! wraps ) {
			return clamp( Math.round( ( value - first ) / step ), 0, lastStep );
		}
		const turned = modulo( value, unitsPerTurn );
		const index = Math.min( Math.round( turned / step ), lastStep );
		// Past the last step, zero can be the nearer neighbor.
		return unitsPerTurn - turned < turned - toValue( index ) ? 0 : index;
	}

	return {
		wraps,
		step,
		precision,
		lastStep,
		firstAngle: toAngle( 0 ),
		lastAngle: toAngle( lastStep ),
		toValue,
		toIndex,
		toAngle,
		fromAngle: ( angle: number ) =>
			toIndex( ( angle / 360 ) * unitsPerTurn ),
	};
}

// The dial is drawn in a square of this many units. The dot sits `DOT_OFFSET`
// units out from the center and is `DOT_RADIUS` units across its radius.
export const VIEW_SIZE = 40;
export const DOT_OFFSET = 10;
export const DOT_RADIUS = 4;
// How far from the center of the dot a press still lands on it. The slack
// around the dot allows for a fingertip.
const DOT_REACH = 6;

// Where the pointer is on the dial. `angle` is its clockwise angle from twelve
// o'clock, between -180 and 180 degrees, or null at the center, which has no
// meaningful angle. `onDot` says whether it is on the dot at `dialAngle`.
export function getPointer(
	event: React.PointerEvent< HTMLElement >,
	dialAngle: number
) {
	const { left, top, width, height } =
		event.currentTarget.getBoundingClientRect();
	const x = event.clientX - left - width / 2;
	const y = event.clientY - top - height / 2;
	const distance = Math.hypot( x, y );
	const radius = Math.min( width, height ) / 2;
	const unit = ( 2 * radius ) / VIEW_SIZE;
	const heading = ( dialAngle * Math.PI ) / 180;
	return {
		angle:
			distance < radius / 4
				? null
				: ( Math.atan2( x, -y ) * 180 ) / Math.PI,
		inside: distance <= radius,
		onDot:
			Math.hypot(
				x - DOT_OFFSET * unit * Math.sin( heading ),
				y + DOT_OFFSET * unit * Math.cos( heading )
			) <=
			DOT_REACH * unit,
	};
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
