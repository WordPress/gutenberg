/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const BlockNavigationContext = createContext( {
	__experimentalWithBlockNavigationSlots: false,
	__experimentalWithEllipsisMenu: false,
} );

export const useBlockNavigationContext = () =>
	useContext( BlockNavigationContext );
