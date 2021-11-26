/**
 * External dependencies
 */
import { isEqual, merge, cloneDeep } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useRef,
	useEffect,
	useMemo,
	memo,
} from '@wordpress/element';
import warn from '@wordpress/warning';

export const ComponentsContext = createContext(
	/** @type {Record<string, any>} */ ( {} )
);
export const useComponentsContext = () => useContext( ComponentsContext );

/**
 * Runs an effect only on update (i.e., ignores the first render)
 *
 * @param {import('react').EffectCallback} effect
 * @param {import('react').DependencyList} deps
 */
function useUpdateEffect( effect, deps ) {
	const mounted = useRef( false );
	useEffect( () => {
		if ( mounted.current ) {
			return effect();
		}
		mounted.current = true;
		return undefined;
	}, deps );
}

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
			isEqual( valueRef.current, value ) &&
			// But not the same reference.
			valueRef.current !== value
		) {
			warn( `Please memoize your context: ${ JSON.stringify( value ) }` );
		}
	}, [ value ] );

	// `parentContext` will always be memoized (i.e., the result of this hook itself)
	// or the default value from when the `ComponentsContext` was originally
	// initialized (which will never change, it's a static variable)
	// so this memoization will prevent `merge` and `cloneDeep` from rerunning unless
	// the references to `value` change OR the `parentContext` has an actual material change
	// (because again, it's guaranteed to be memoized or a static reference to the empty object
	// so we know that the only changes for `parentContext` are material ones... i.e., why we
	// don't have to warn in the `useUpdateEffect` hook above for `parentContext` and we only
	// need to bother with the `value`). The `useUpdateEffect` above will ensure that we are
	// correctly warning when the `value` isn't being properly memoized. All of that to say
	// that this should be super safe to assume that `useMemo` will only run on actual
	// changes to the two dependencies, therefore saving us calls to `merge` and `cloneDeep`!
	const config = useMemo( () => {
		return merge( cloneDeep( parentContext ), value );
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
