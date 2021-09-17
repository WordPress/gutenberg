/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const NavigatorContext = createContext( {} );
export const useNavigatorContext = () => useContext( NavigatorContext );
