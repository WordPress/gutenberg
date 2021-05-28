/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * @typedef {{ id?: import('react').ReactText, horizontal: boolean }} FormGroupContext
 */

/**
 * @type {FormGroupContext}
 */
const initialContext = {
	id: undefined,
	horizontal: true,
};

/**
 * @type {import('react').Context<FormGroupContext>}
 */
export const FormGroupContext = createContext( initialContext );
export const useFormGroupContext = () => useContext( FormGroupContext );

/**
 * @param {string | undefined} id The preferred id for the form group element.
 * @return {import('react').ReactText | undefined} The form group context id.
 */
export const useFormGroupContextId = ( id ) => {
	const contextId = useFormGroupContext().id;
	return id || contextId;
};
