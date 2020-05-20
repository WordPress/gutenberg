/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const BlockNavigationContext = createContext( {
	__experimentalWithBlockNavigationSlots: false,
	__experimentalWithEllipsisMenu: false,
	__experimentalWithEllipsisMenuMinLevel: 0,
} );

export const useBlockNavigationContext = () =>
	useContext( BlockNavigationContext );
