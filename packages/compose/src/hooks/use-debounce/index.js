/**
 * External dependencies
 */
import { debounce } from 'lodash';
import { useMemoOne } from 'use-memo-one';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Debounces a function with Lodash's `debounce`. A new debounced function will
 * be returned and any scheduled calls cancelled if any of the arguments change,
 * including the function to debounce, so please wrap functions created on
 * render in components in `useCallback`.
 *
 * @param {...any} args Arguments passed to Lodash's `debounce`.
 */
export default function useDebounce( ...args ) {
	const debounced = useMemoOne( () => debounce( ...args ), args );
	useEffect( () => () => debounced.cancel(), [ debounced ] );
	return debounced;
}
