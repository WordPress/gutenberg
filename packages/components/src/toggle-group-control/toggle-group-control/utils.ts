/**
 * WordPress dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ToggleGroupControlProps } from '../types';

type ValueProp = ToggleGroupControlProps[ 'value' ];

/**
 * Used to determine, via an internal heuristics, whether an `undefined` value
 * received for the `value` prop should be interpreted as the component being
 * used in uncontrolled mode, or as an "empty" value for controlled mode.
 *
 * @param valueProp The received `value`
 */
export function useComputeControlledOrUncontrolledValue(
	valueProp: ValueProp
): { value: ValueProp; defaultValue: ValueProp } {
	const [
		hasEverBeenUsedInControlledMode,
		setHasEverBeenUsedInControlledMode,
	] = useState( false );
	const previousValueProp = usePrevious( valueProp );

	useEffect( () => {
		if ( ! hasEverBeenUsedInControlledMode ) {
			// Assume the component is being used in controlled mode if:
			// - the `value` prop is not `undefined`
			// - the `value` prop was not previously `undefined` and was given a new value
			setHasEverBeenUsedInControlledMode(
				valueProp !== undefined &&
					previousValueProp !== undefined &&
					valueProp !== previousValueProp
			);
		}
	}, [ valueProp, previousValueProp, hasEverBeenUsedInControlledMode ] );

	let value, defaultValue;

	if ( hasEverBeenUsedInControlledMode ) {
		// When in controlled mode, use `''` instead of `undefined`
		value = valueProp ?? '';
	} else {
		// When in uncontrolled mode, the `value` should be intended as the initial value
		defaultValue = valueProp;
	}

	return { value, defaultValue };
}
