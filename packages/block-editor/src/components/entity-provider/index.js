/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const Context = createContext( {} );

/**
 * Context provider component for providing
 * the implementations of the entity getter
 * and setters.
 *
 * @typedef {Function} EntityProvider
 */
export default Context.Provider;

/**
 * Hook for accessing the entity getters and setters
 * provided by the nearest parent entity provider.
 *
 * @return {Object} The object with getters and setters.
 */
export function useEntity() {
	return useContext( Context );
}

/**
 * Hook for getting the currently persisted value
 * for an entity attribute.
 *
 * If there is no provider or it does not provide
 * an implementation for the required hook,
 * undefined is returned.
 *
 * @param {...*} args Any arguments the implementation
 *                     might require.
 *
 * @return {*} The value.
 */
export function useCurrentEntityAttribute( ...args ) {
	const { useCurrentEntityAttribute: func } = useEntity();
	return func ? func( ...args ) : undefined;
}

/**
 * Hook for getting the edited value for an entity attribute,
 * falling back to the persisted value if there isn't
 * one.
 *
 * If there is no provider or it does not provide
 * an implementation for the required hook,
 * undefined is returned.
 *
 * @param {...*} args Any arguments the implementation
 *                     might require.
 *
 * @return {*} The value.
 */
export function useEditedEntityAttribute( ...args ) {
	const { useEditedEntityAttribute: func } = useEntity();
	return func ? func( ...args ) : undefined;
}

const editEntityNoop = () => {};

/**
 * Hook for accessing the entity's main edit function.
 *
 * If there is no provider or it does not provide
 * an implementation for the required hook,
 * a "noop" function is returned.
 *
 * @return {Function} The function or "noop".
 */
export function useEditEntity() {
	const { useEditEntity: func } = useEntity();
	return func ? func() : editEntityNoop;
}
