/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const BlockNavigationContext = createContext( {
	__experimentalWithBlockNavigationSlots: false,
} );

export const useBlockNavigationContext = () =>
	useContext( BlockNavigationContext );
