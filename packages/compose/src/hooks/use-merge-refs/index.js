/**
 * External dependencies
 */
import mergeRefs from 'react-merge-refs';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/** @typedef {import('@wordpress/element').RefObject} RefObject */

/**
 * A ref should persist throughout a component's lifecycle, so it should not
 * have any dependencies. If dependencies are needed in a ref callback, assign
 * them to refs with `useRef` and use the ref in the callback or use
 * `useEffect`.
 */
const DEPENDENCIES = [];

/**
 * Merges the given refs into a new ref, which will persist for the full
 * lifetime of the component, as a ref should be.
 *
 * @param  {...RefObject|Function} refs Ref objects or callbacks to merge.
 *
 * @return {Function} A new ref callback.
 */
export default function useMergeRefs( ...refs ) {
	return useCallback( mergeRefs( refs ), DEPENDENCIES );
}
