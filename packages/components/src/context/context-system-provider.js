/**
 * External dependencies
 */
import deepmerge from 'deepmerge';
import fastDeepEqual from 'fast-deep-equal/es6';
import { isPlainObject } from 'is-plain-object';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useRef,
	useMemo,
	memo,
} from '@wordpress/element';
import warn from '@wordpress/warning';

/**
 * Internal dependencies
 */
import { useUpdateEffect } from '../utils';

export const ComponentsContext = createContext(
	/** @type {Record<string, any>} */ ( {} )
);
export const useComponentsContext = () => useContext( ComponentsContext );

/**
 * Consolidates incoming ContextSystem values with a (potential) parent ContextSystem value.
 *
 * Note: This function will warn if it detects an un-memoized `value`
 *
 * @param {Object}              props
 * @param {Record<string, any>} props.value
 * @return {Record<string, any>} The consolidated value.
 */
function useContextSystemBridge( { value } ) {
	const parentContext = useComponentsContext();

	const valueRef = useRef( value );

	useUpdateEffect( () => {
		if (
			// Objects are equivalent.
			fastDeepEqual( valueRef.current, value ) &&
			// But not the same reference.
			valueRef.current !== value
		) {
			warn( `Please memoize your context: ${ JSON.stringify( value ) }` );
		}
	}, [ value ] );

	// `parentContext` will always be memoized (i.e., the result of this hook itself)
	// or the default value from when the `ComponentsContext` was originally
	// initialized (which will never change, it's a static variable)
	// so this memoization will prevent `deepmerge()` from rerunning unless
	// the references to `value` change OR the `parentContext` has an actual material change
	// (because again, it's guaranteed to be memoized or a static reference to the empty object
	// so we know that the only changes for `parentContext` are material ones... i.e., why we
	// don't have to warn in the `useUpdateEffect` hook above for `parentContext` and we only
	// need to bother with the `value`). The `useUpdateEffect` above will ensure that we are
	// correctly warning when the `value` isn't being properly memoized. All of that to say
	// that this should be super safe to assume that `useMemo` will only run on actual
	// changes to the two dependencies, therefore saving us calls to `deepmerge()`!
	const config = useMemo( () => {
		// Deep clone `parentContext` to avoid mutating it later.
		return deepmerge( parentContext ?? {}, value ?? {}, {
			isMergeableObject: isPlainObject,
		} );
	}, [ parentContext, value ] );

	return config;
}

/**
 * A Provider component that can modify props for connected components within
 * the Context system.
 *
 * @example
 * ```jsx
 * <ContextSystemProvider value={{ Button: { size: 'small' }}}>
 *   <Button>...</Button>
 * </ContextSystemProvider>
 * ```
 *
 * @template {Record<string, any>} T
 * @param {Object}                    options
 * @param {import('react').ReactNode} options.children Children to render.
 * @param {T}                         options.value    Props to render into connected components.
 * @return {JSX.Element} A Provider wrapped component.
 */
const BaseContextSystemProvider = ( { children, value } ) => {
	const contextValue = useContextSystemBridge( { value } );

	return (
		<ComponentsContext.Provider value={ contextValue }>
			{ children }
		</ComponentsContext.Provider>
	);
};

export const ContextSystemProvider = memo( BaseContextSystemProvider );
