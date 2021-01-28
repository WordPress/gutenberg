/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * @type {import('react').Context<{ id: string | null, horizontal: boolean }>}
 */
export const FormGroupContext = createContext( { id: null, horizontal: true } );
export const useFormGroupContext = () => useContext( FormGroupContext );

/**
 * @param {string} id The preferred id for the form group element.
 * @return {string | null} The form group context id.
 */
export const useFormGroupContextId = ( id ) => {
	const contextId = useFormGroupContext().id;
	return id || contextId;
};
