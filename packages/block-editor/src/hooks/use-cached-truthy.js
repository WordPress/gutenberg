/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Keeps an up-to-date copy of the passed value and returns it. If value becomes falsy, it will return the last truthy copy.
 *
 * @param {any} value
 * @return {any} value
 */
export function useCachedTruthy( value ) {
	const [ cachedValue, setCachedValue ] = useState( value );
	useEffect( () => {
		if ( value ) {
			setCachedValue( value );
		}
	}, [ value ] );
	return cachedValue;
}
