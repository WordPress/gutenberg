/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const BlockNavigationContext = createContext( {
	__experimentalWithBlockNavigationSlots: false,
	__experimentalWithBlockNavigationBlockSettings: false,
	__experimentalWithBlockNavigationBlockSettingsMinLevel: 0,
} );

export const useBlockNavigationContext = () =>
	useContext( BlockNavigationContext );
