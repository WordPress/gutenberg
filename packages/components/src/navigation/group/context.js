/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const NavigationGroupContext = createContext( { group: undefined } );

export const useNavigationGroupContext = () =>
	useContext( NavigationGroupContext );
