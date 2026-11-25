export function modulo( value: number, period: number ) {
	return ( ( value % period ) + period ) % period;
}

function clamp( value: number, min: number, max: number ) {
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
	// The value of a step, rounded as the dial reports it.
	const reach = ( index: number ) =>
		Number( ( first + index * step ).toFixed( precision ) );
	// Rounding can put the last step of a bounded dial a hair above `max`, so
	// values stop there.
	const toValue = ( index: number ) =>
		( wraps ? reach( index ) : Math.min( reach( index ), max ) ) || 0;
	// Count the steps that fit. The nearest whole count is right unless its
	// step goes past the limit, in which case the step before it is the last.
	// The slack covers the rounding error of the arithmetic, so a step that
	// lands on the limit counts as reaching it. A wrapping dial leaves out
	// the full turn, which has the heading of zero.
	const limit = wraps ? unitsPerTurn : max;
	const slack =
		8 *
		Number.EPSILON *
		Math.max( Math.abs( first ), Math.abs( limit ), step );
	let lastStep = Math.max( 0, Math.round( span / step ) );
	if (
		lastStep > 0 &&
		( wraps
			? reach( lastStep ) > limit - slack
			: reach( lastStep ) > limit + slack )
	) {
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

	const firstAngle = toAngle( 0 );
	const lastAngle = toAngle( lastStep );
	const stepAngle = ( step / unitsPerTurn ) * 360;

	// The angle of a value as given, before it snaps to a step. A bounded
	// dial keeps it within its ends.
	const exactAngle = ( value: number ) =>
		wraps
			? ( value / unitsPerTurn ) * 360
			: clamp( ( value / unitsPerTurn ) * 360, firstAngle, lastAngle );

	// The dial angle that a press on `heading` selects, for a value that lies
	// at `valueAngle`. A wrapping dial has one turn, so the heading is the
	// answer. A bounded dial has the heading on several turns. It takes the
	// one nearest to the value, so a press never moves the value by more than
	// it has to. When that turn does not have the heading, it takes the turn
	// that does, or else the one that brings it closest to an end. A heading
	// that rounds to an end counts as within the range.
	function press( heading: number, valueAngle: number ) {
		if ( wraps ) {
			return heading;
		}
		const nearest =
			heading +
			360 *
				Math.round(
					( clamp( valueAngle, firstAngle, lastAngle ) - heading ) /
						360
				);
		const outside = ( angle: number ) =>
			Math.max(
				firstAngle - angle - stepAngle / 2,
				angle - lastAngle - stepAngle / 2,
				0
			);
		return [ nearest - 360, nearest + 360 ].reduce(
			( best, candidate ) =>
				outside( candidate ) < outside( best ) ? candidate : best,
			nearest
		);
	}

	return {
		wraps,
		step,
		precision,
		lastStep,
		toValue,
		toIndex,
		toAngle,
		fromAngle: ( angle: number ) =>
			toIndex( ( angle / 360 ) * unitsPerTurn ),
		exactAngle,
		press,
	};
}

// The shorter way round from one heading to another, in degrees between -180
// and 180. Adding these up over a drag counts the turns the pointer makes.
export function turnBetween( from: number, to: number ) {
	return modulo( to - from + 180, 360 ) - 180;
}

// The dial is drawn in a square of this many units. The dot sits `DOT_OFFSET`
// units out from the center and is `DOT_RADIUS` units across its radius.
export const VIEW_SIZE = 40;
export const DOT_OFFSET = 10;
export const DOT_RADIUS = 4;
// How far from the center of the dot a press still lands on it. The slack
// around the dot allows for a fingertip.
const DOT_REACH = 6;
// The middle of the dial, where a pointer has no meaningful heading.
const CENTER_RADIUS = 5;

type Point = { x: number; y: number };

// Measures the dial once, and returns a function that says where a position on
// the screen is on it. `x` and `y` are measured from the center in the units
// the dial is drawn in. `heading` is the clockwise angle from twelve o'clock,
// between -180 and 180 degrees, or null in the middle.
export function measure( dial: HTMLElement ) {
	const { left, top, width, height } = dial.getBoundingClientRect();
	const unit = Math.min( width, height ) / VIEW_SIZE;
	return ( { clientX, clientY }: { clientX: number; clientY: number } ) => {
		const x = ( clientX - left - width / 2 ) / unit;
		const y = ( clientY - top - height / 2 ) / unit;
		return {
			x,
			y,
			heading:
				Math.hypot( x, y ) < CENTER_RADIUS
					? null
					: ( Math.atan2( x, -y ) * 180 ) / Math.PI,
		};
	};
}

// Whether the straight path between two positions passes through the middle of
// the dial. Such a move is close to half a turn either way, so it says where
// the pointer went but not which way round.
export function crossesMiddle( from: Point, to: Point ) {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const length = dx * dx + dy * dy;
	const along =
		length === 0
			? 0
			: clamp( -( from.x * dx + from.y * dy ) / length, 0, 1 );
	return (
		Math.hypot( from.x + along * dx, from.y + along * dy ) < CENTER_RADIUS
	);
}

// Whether a position is on the dot of a dial that points to `dialAngle`.
export function isOnDot( { x, y }: Point, dialAngle: number ) {
	const heading = ( dialAngle * Math.PI ) / 180;
	return (
		Math.hypot(
			x - DOT_OFFSET * Math.sin( heading ),
			y + DOT_OFFSET * Math.cos( heading )
		) <= DOT_REACH
	);
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
