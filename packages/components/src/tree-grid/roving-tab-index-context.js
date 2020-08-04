/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const RovingTabIndexContext = createContext();
export const useRovingTabIndexContext = () =>
	useContext( RovingTabIndexContext );
export const RovingTabIndexProvider = RovingTabIndexContext.Provider;
