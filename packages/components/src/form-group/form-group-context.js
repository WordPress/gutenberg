/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * @type {import('react').Context<{ id?: string, horizontal: boolean }>}
 */
export const FormGroupContext = createContext( {
	id: 'undefined',
	horizontal: true,
} );
export const useFormGroupContext = () => useContext( FormGroupContext );

/**
 * @param {string | undefined} id The preferred id for the form group element.
 * @return {string | undefined} The form group context id.
 */
export const useFormGroupContextId = ( id ) => {
	const contextId = useFormGroupContext().id;
	return id || contextId;
};
