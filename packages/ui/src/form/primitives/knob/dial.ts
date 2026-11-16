// A gap at the bottom gives a bounded dial two distinct end stops.
export const BOUNDED_SWEEP = 270;

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

export function getStepRange( min = 0, max = 100, stepProp = 1 ) {
	const requestedStep =
		Number.isFinite( stepProp ) && stepProp > 0 ? stepProp : 1;
	const span = max - min;
	const spansRange = span > 0 && requestedStep >= span;
	const precision = Math.min(
		100,
		Math.max(
			decimalPlaces( min ),
			decimalPlaces( spansRange ? max : requestedStep )
		)
	);
	const step = spansRange
		? Number( span.toFixed( precision ) )
		: requestedStep;
	const toValue = ( index: number ) =>
		Number( ( min + index * step ).toFixed( precision ) ) || 0;
	const toIndex = ( value: number ) => Math.round( ( value - min ) / step );
	const upperStep = Math.ceil( span / step );
	const lastStep = toValue( upperStep ) <= max ? upperStep : upperStep - 1;
	const snap = ( value: number ) =>
		toValue( clamp( toIndex( value ), 0, lastStep ) );
	return { step, precision, toValue, toIndex, lastStep, snap };
}

export function getAngleOnTurn(
	pointer: number,
	current: number,
	min: number,
	max: number,
	seamless: boolean,
	degreesPerStep: number
) {
	const nearest = pointer + 360 * Math.round( ( current - pointer ) / 360 );
	// A tap can move up to one turn. Compare actual step headings on either
	// side, since a fractional number of steps per turn shifts their positions.
	const reach =
		Math.floor( Number( ( 360 / degreesPerStep ).toPrecision( 15 ) ) ) *
		degreesPerStep;
	const lower = seamless ? current - reach : Math.max( min, current - reach );
	const upper = seamless ? current + reach : Math.min( max, current + reach );
	let bestAngle = current;
	let bestError = Infinity;
	let bestSteps = Infinity;
	for ( const turn of [ nearest, nearest - 360, nearest + 360 ] ) {
		const angle = clamp( turn, lower, upper );
		const steps = Math.round( ( angle - current ) / degreesPerStep );
		const heading = current + steps * degreesPerStep;
		const error = Math.abs( modulo( heading - pointer + 180, 360 ) - 180 );
		if (
			error < bestError - 1e-9 ||
			( Math.abs( error - bestError ) <= 1e-9 &&
				Math.abs( steps ) < bestSteps )
		) {
			bestAngle = angle;
			bestError = error;
			bestSteps = Math.abs( steps );
		}
	}
	return bestAngle;
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
