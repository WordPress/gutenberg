import type { KnobUnit } from './types';

/**
 * The size of one full turn in each unit.
 */
export const FULL_TURN: Record< KnobUnit, number > = {
	deg: 360,
	turn: 1,
	rad: 2 * Math.PI,
	grad: 400,
};

/**
 * The default `step` and `largeStep` for each unit.
 */
export const DEFAULT_STEPS: Record<
	KnobUnit,
	{ step: number; largeStep: number }
> = {
	deg: { step: 1, largeStep: 10 },
	turn: { step: 0.01, largeStep: 0.1 },
	rad: { step: 0.01, largeStep: 0.1 },
	grad: { step: 1, largeStep: 10 },
};

export function clamp( value: number, min: number, max: number ) {
	return Math.min( Math.max( value, min ), max );
}

function getPrecision( step: number ) {
	return String( step ).split( '.' )[ 1 ]?.length ?? 0;
}

/**
 * Returns `angle` within one turn, from 0 up to but not including
 * `fullTurn`.
 *
 * @param angle    An angle.
 * @param fullTurn The size of one full turn in the same unit.
 */
export function wrapAngle( angle: number, fullTurn: number ) {
	return ( ( angle % fullTurn ) + fullTurn ) % fullTurn;
}

/**
 * Rounds `value` to the nearest multiple of `step` counted from `origin`,
 * without the floating point noise of a fractional step.
 *
 * @param value  The value to round.
 * @param step   The step size.
 * @param origin The value that steps are counted from.
 */
export function roundToStep( value: number, step: number, origin: number ) {
	const rounded = Math.round( ( value - origin ) / step ) * step + origin;
	return Number( rounded.toFixed( getPrecision( step ) ) );
}

/**
 * Wraps `angle` into one turn and rounds it to `step`. A value that rounds
 * up to a full turn becomes 0.
 *
 * @param angle    An angle.
 * @param step     The step size.
 * @param fullTurn The size of one full turn in the same unit.
 */
export function wrapToStep( angle: number, step: number, fullTurn: number ) {
	const rounded = roundToStep( wrapAngle( angle, fullTurn ), step, 0 );
	return rounded >= fullTurn ? 0 : rounded;
}

/**
 * Returns the last step before a full turn, the largest value a wrapping
 * dial can reach.
 *
 * @param step     The step size.
 * @param fullTurn The size of one full turn in the same unit.
 */
export function getLastStepInTurn( step: number, fullTurn: number ) {
	// The tolerance keeps 360 / 1 from counting as just over 360 steps.
	const steps = Math.ceil( fullTurn / step - 1e-9 ) - 1;
	return Number( ( steps * step ).toFixed( getPrecision( step ) ) );
}

/**
 * Returns the angle of a point around the center of `rect`, clockwise from
 * the top, from 0 up to but not including `fullTurn`.
 *
 * @param rect     The bounds of the dial.
 * @param clientX  The horizontal position of the point.
 * @param clientY  The vertical position of the point.
 * @param fullTurn The size of one full turn in the unit to return.
 */
export function getPointerAngle(
	rect: DOMRect,
	clientX: number,
	clientY: number,
	fullTurn: number
) {
	const x = clientX - ( rect.left + rect.width / 2 );
	const y = clientY - ( rect.top + rect.height / 2 );
	const turns = Math.atan2( y, x ) / ( 2 * Math.PI ) + 0.25;
	return wrapAngle( turns * fullTurn, fullTurn );
}

/**
 * Returns the angle that points the same way as `angle` and is closest to
 * `reference`.
 *
 * @param angle     An angle.
 * @param reference The angle to stay close to.
 * @param fullTurn  The size of one full turn in the same unit.
 */
export function getNearestEquivalent(
	angle: number,
	reference: number,
	fullTurn: number
) {
	return angle + fullTurn * Math.round( ( reference - angle ) / fullTurn );
}

/**
 * Returns the turn from `from` to `to` the short way round, with a half
 * turn going clockwise.
 *
 * @param from     The starting angle.
 * @param to       The ending angle.
 * @param fullTurn The size of one full turn in the same unit.
 */
export function getShortestTurn( from: number, to: number, fullTurn: number ) {
	const delta = to - from;
	return delta + fullTurn * Math.round( -delta / fullTurn );
}
