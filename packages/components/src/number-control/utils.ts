/**
 * External dependencies
 */
import type { KeyboardEvent, MouseEvent } from 'react';

/**
 * Internal dependencies
 */
import { add, subtract, roundClamp } from '../utils/math';

export const computeStep = ( {
	shiftStep,
	baseStep,
	enableShift = false,
}: {
	shiftStep: number;
	baseStep: number;
	enableShift?: boolean;
} ) => ( enableShift ? shiftStep * baseStep : baseStep );

type CommonConstrainValueArgs = {
	value: number;
	isStepAny: boolean;
	min: number;
	max: number;
	baseStep: number;
};

/**
 * Applies clamping based on min/max and step value.
 * When step is "any" clamp the value, otherwise round and clamp it.
 *
 * @param  args
 * @param  args.value        The value to constrain
 * @param  args.isStepAny    True is `step==="any"`
 * @param  args.min          The minimum value that the result can assume
 * @param  args.max          The maximum value that the result can assume
 * @param  args.baseStep     The default, base step value
 * @param  args.stepOverride Override `baseStep` if necessary
 */
export const constrainValue = ( {
	value,
	isStepAny,
	min,
	max,
	baseStep,
	stepOverride,
}: CommonConstrainValueArgs & { stepOverride?: number } ) =>
	isStepAny
		? Math.min( max, Math.max( min, value ) )
		: roundClamp( value, min, max, stepOverride ?? baseStep );

/**
 * Computes the new value when the current value needs to change following a
 * "spin" event (i.e. up or down arrow, up or down spin buttons)
 *
 * @param  args
 * @param  args.value              The value to spin
 * @param  args.event              The browser event causing the "spin"
 * @param  args.direction          'up' for increments, 'down' for decrements
 * @param  args.isShiftStepEnabled True if pressing shift enables increased step
 * @param  args.shiftStep          The step value to use when shift-stepping
 * @param  args.baseStep           The default, base step value
 * @param  args.isStepAny          True is `step==="any"`
 * @param  args.min                The minimum value that the result can assume
 * @param  args.max                The maximum value that the result can assume
 */
export const spinValue = ( {
	value,
	direction,
	event,
	isShiftStepEnabled,
	shiftStep,
	baseStep,
	...rest
}: CommonConstrainValueArgs & {
	event: KeyboardEvent | MouseEvent | undefined;
	direction: 'up' | 'down';
	isShiftStepEnabled: boolean;
	shiftStep: number;
} ) => {
	event?.preventDefault();

	const enableShift = event?.shiftKey && isShiftStepEnabled;

	const computedStep = computeStep( {
		shiftStep,
		enableShift,
		baseStep,
	} );

	const nextValue =
		direction === 'up'
			? add( value, computedStep )
			: subtract( value, computedStep );

	return constrainValue( {
		value: nextValue,
		baseStep,
		stepOverride: enableShift ? computedStep : undefined,
		...rest,
	} );
};
