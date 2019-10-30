/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const ActionBarContext = createContext( {} );
export const useActionBarContext = () => useContext( ActionBarContext );
