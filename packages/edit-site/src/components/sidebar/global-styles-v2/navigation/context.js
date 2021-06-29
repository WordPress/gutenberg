/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { VIEW_ROOT } from './constants';

export const GlobalStylesNavigationContext = createContext( {
	currentView: VIEW_ROOT,
	setCurrentView: () => {},
} );

export const useGlobalStylesNavigationContext = () =>
	useContext( GlobalStylesNavigationContext );
