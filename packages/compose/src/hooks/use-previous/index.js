/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Use something's value from the previous render.
 * Based on https://usehooks.com/usePrevious/.
 *
 * @template T T
 * @param {T} value The value to track.
 * @param {T[]} optionalDependencyList of dependencies describing on change of which parameter a value should be cached. By default previous value is saved every time the value changes.
 * @return {T|undefined} The value cached, when no optional dependencies provided, previous value is equal to value from the previous render.
 */
export default function usePrevious(
	value,
	optionalDependencyList = [ value ]
) {
	// Disable reason: without an explicit type detail, the type of ref will be
	// inferred based on the initial useRef argument, which is undefined.
	// https://github.com/WordPress/gutenberg/pull/22597#issuecomment-633588366
	/* eslint-disable jsdoc/no-undefined-types */
	const ref = useRef( /** @type {T|undefined} */ ( undefined ) );
	/* eslint-enable jsdoc/no-undefined-types */

	// Store current value in ref.
	useEffect( () => {
		ref.current = value;
	}, optionalDependencyList ); // Re-run when any dependency changes.

	// Return previous value (happens before update in useEffect above).
	return ref.current;
}
