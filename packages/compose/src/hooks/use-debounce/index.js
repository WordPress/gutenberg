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
 * Debounces a function with Lodash's `debounce`.
 *
 * @param {...any} args Arguments passed to Lodash's `debounce`.
 */
export default function useDebounce( ...args ) {
	const debounced = useMemoOne( () => debounce( ...args ), args );
	useEffect( () => () => debounced.cancel(), [ debounced ] );
	return debounced;
}
