export function modulo( value: number, period: number ) {
	const remainder = value % period;
	return remainder < 0 ? remainder + period : remainder;
}

function clamp( value: number, min: number, max: number ) {
	return Math.max( min, Math.min( max, value ) );
}

// The dial counts in whole steps. A value is a number of steps, and a full turn
// is `stepsPerTurn` of them, so the arithmetic stays in whole numbers. Units
// such as radians or fractions of a turn belong to whatever shows the number.
//
// Without bounds, the steps cover one turn and repeat: the last one is the step
// before a full turn, which has the heading of zero. With bounds, the dial
// counts turns between the whole steps that `min` and `max` enclose.
export function getDial( {
	min,
	max,
	stepsPerTurn: stepsPerTurnProp,
}: {
	min?: number;
	max?: number;
	stepsPerTurn?: number;
} ) {
	const stepsPerTurn =
		stepsPerTurnProp !== undefined &&
		Number.isInteger( stepsPerTurnProp ) &&
		stepsPerTurnProp > 1
			? stepsPerTurnProp
			: 360;
	const stepAngle = 360 / stepsPerTurn;
	const wraps = min === undefined || max === undefined;
	const first = wraps ? 0 : Math.ceil( min );
	const last = wraps
		? stepsPerTurn - 1
		: Math.max( first, Math.floor( max ) );
	const firstAngle = first * stepAngle;
	const lastAngle = last * stepAngle;

	// The step nearest to a value. A wrapping dial brings it into one turn,
	// and a bounded dial stops at its ends.
	const snap = ( value: number ) => {
		const step = Math.round( value );
		return (
			( wraps
				? modulo( step, stepsPerTurn )
				: clamp( step, first, last ) ) || 0
		);
	};

	// The dial angle that a press on `heading` selects, for a value that lies
	// at `valueAngle`. A wrapping dial has one turn, so the heading is the
	// answer. A bounded dial has the heading on several turns. It takes the
	// one nearest to the value, so a press never moves the value by more than
	// it has to. A turn has the heading when the step it rounds to is in the
	// range. When the nearest turn does not, the press takes the turn that
	// does, or else the one that comes closest to an end.
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
		// How far an angle lies beyond the range, or zero when the step it
		// rounds to is in the range.
		const outside = ( angle: number ) => {
			const step = Math.round( angle / stepAngle );
			return step >= first && step <= last
				? 0
				: Math.max( firstAngle - angle, angle - lastAngle );
		};
		return [ nearest - 360, nearest + 360 ].reduce(
			( best, candidate ) =>
				outside( candidate ) < outside( best ) ? candidate : best,
			nearest
		);
	}

	return {
		wraps,
		stepsPerTurn,
		first,
		last,
		snap,
		toAngle: ( step: number ) => step * stepAngle,
		fromAngle: ( angle: number ) => snap( angle / stepAngle ),
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
