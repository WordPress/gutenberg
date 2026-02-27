/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { NavigationGroupContext as NavigationGroupContextType } from '../types';

export const NavigationGroupContext =
	createContext< NavigationGroupContextType >( { group: undefined } );
NavigationGroupContext.displayName = 'NavigationGroupContext';

export const useNavigationGroupContext = () =>
	useContext( NavigationGroupContext );
