/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ToggleGroupControlProps } from '../types';

/**
 * Used to determine, via an internal heuristics, whether an `undefined` value
 * received for the `value` prop should be interpreted as the component being
 * used in uncontrolled mode, or as an "empty" value for controlled mode.
 *
 * @param valueProp The received `value`
 */
export function useAdjustUndefinedValue(
	valueProp: ToggleGroupControlProps[ 'value' ]
): ToggleGroupControlProps[ 'value' ] {
	const hasEverBeenUsedInControlledMode = useRef(
		typeof valueProp !== 'undefined'
	);

	useEffect( () => {
		if ( ! hasEverBeenUsedInControlledMode.current ) {
			hasEverBeenUsedInControlledMode.current =
				typeof valueProp !== 'undefined';
		}
	}, [ valueProp ] );

	return valueProp === undefined && hasEverBeenUsedInControlledMode.current
		? ''
		: valueProp;
}
