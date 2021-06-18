/**
 * External dependencies
 */
import { isEqual, merge } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useRef,
	useState,
	memo,
} from '@wordpress/element';
import { useIsomorphicLayoutEffect } from '@wordpress/compose';

export const ComponentsContext = createContext(
	/** @type {Record<string, any>} */ ( {} )
);
export const useComponentsContext = () => useContext( ComponentsContext );

/**
 * Consolidates incoming ContextSystem values with a (potential) parent ContextSystem value.
 *
 * @param {Object}              props
 * @param {Record<string, any>} props.value
 * @return {Record<string, any>} The consolidated value.
 */
function useContextSystemBridge( { value } ) {
	const parentContext = useComponentsContext();
	const parentContextRef = useRef( parentContext );
	const valueRef = useRef( merge( parentContext, value ) );

	const [ config, setConfig ] = useState( valueRef.current );

	useIsomorphicLayoutEffect( () => {
		let hasChange = false;

		if ( ! isEqual( value, valueRef.current ) ) {
			valueRef.current = value;
			hasChange = true;
		}

		if ( ! isEqual( parentContext, parentContextRef.current ) ) {
			valueRef.current = merge( parentContext, valueRef.current );
			parentContextRef.current = parentContext;
			hasChange = true;
		}

		if ( hasChange ) {
			setConfig( ( prev ) => ( { ...prev, ...valueRef.current } ) );
		}
	}, [ value, parentContext ] );

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
