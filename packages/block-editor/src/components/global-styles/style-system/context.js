/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const initialContext = { theme: {} };
export const StyleSystemContext = createContext( initialContext );
export const useStyleSystemContext = () => useContext( StyleSystemContext );
