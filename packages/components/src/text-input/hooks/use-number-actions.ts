/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { MutableRefObject } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useShiftStep } from './use-shift-step';
import { isValueNumeric } from '../../utils/values';
import { useLatestRef } from '../../utils';
import { add, subtract, roundClampString } from '../../utils/math';

export interface UseNumberActionsProps {
	value?: number | string;
	onChange: ( value: string ) => void;
	type?: string;
	max?: number;
	min?: number;
	shiftStep?: number;
	step?: number;
	isShiftStepEnabled?: boolean;
	incrementFromNonNumericValue?: boolean;
	ref: MutableRefObject< HTMLElement | undefined >;
}

export function useNumberActions( {
	incrementFromNonNumericValue,
	isShiftStepEnabled,
	max,
	min,
	onChange,
	shiftStep: shiftStepProp = 10,
	step = 1,
	type,
	value,
	ref,
}: UseNumberActionsProps ) {
	const stepMultiplier =
		useShiftStep( {
			isShiftStepEnabled,
			shiftStep: shiftStepProp,
			ref,
		} ) || step;
	const shiftStep = stepMultiplier * step;

	const isInputTypeNumeric = type === 'number';
	const isNumeric = isValueNumeric( value );

	const skipAction =
		! isInputTypeNumeric && ! isNumeric && ! incrementFromNonNumericValue;

	/**
	 * Create (synced) references to avoid recreating increment and decrement
	 * callbacks.
	 */
	const propRefs = useLatestRef( {
		min,
		max,
		value,
		shiftStep,
		onChange,
	} as const );

	const increment = useCallback(
		( jumpStep: number = 0 ) => {
			if ( skipAction ) return;
			if ( ! propRefs.current ) return;
			/* eslint-disable no-shadow */
			const { max, min, onChange, shiftStep, value } = propRefs.current;
			/* eslint-enable no-shadow */
			const baseValue = isValueNumeric( value ) ? value : 0;
			const nextValue = add( jumpStep * step, shiftStep );
			const next = roundClampString(
				add( baseValue, nextValue ),
				min,
				max,
				shiftStep
			);

			onChange( next );
		},
		[ skipAction, propRefs, step ]
	);

	const decrement = useCallback(
		( jumpStep: number = 0 ) => {
			if ( skipAction ) return;
			if ( ! propRefs.current ) return;
			/* eslint-disable no-shadow */
			const { max, min, onChange, shiftStep, value } = propRefs.current;
			/* eslint-enable no-shadow */
			const baseValue = isValueNumeric( value ) ? value : 0;
			const nextValue = add( jumpStep * step, shiftStep );
			const next = roundClampString(
				subtract( baseValue, nextValue ),
				min,
				max,
				shiftStep
			);

			onChange( next );
		},
		[ skipAction, propRefs, step ]
	);

	return { increment, decrement };
}
