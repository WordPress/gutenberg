/**
 * WordPress dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';

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
	const isInitialRenderRef = useRef( true );
	const prevValueProp = usePrevious( valueProp );
	const prevIsControlledRef = useRef( false );

	useEffect( () => {
		if ( isInitialRenderRef.current ) {
			isInitialRenderRef.current = false;
		}
	}, [] );

	// Assume the component is being used in controlled mode on the first re-render
	// that has a different `valueProp` from the previous render.
	const isControlled =
		prevIsControlledRef.current ||
		( ! isInitialRenderRef.current && prevValueProp !== valueProp );
	useEffect( () => {
		prevIsControlledRef.current = isControlled;
	}, [ isControlled ] );

	if ( isControlled ) {
		// When in controlled mode, use `''` instead of `undefined`
		return { value: valueProp ?? '', defaultValue: undefined };
	}

	// When in uncontrolled mode, the `value` should be intended as the initial value
	return { value: undefined, defaultValue: valueProp };
}
