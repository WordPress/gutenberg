/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const BlockNavigationContext = createContext( {
	__experimentalWithBlockNavigationSlots: false,
	__experimentalWithItemSettings: false,
	__experimentalWithItemSettingsMinLevel: 0,
} );

export const useBlockNavigationContext = () =>
	useContext( BlockNavigationContext );
