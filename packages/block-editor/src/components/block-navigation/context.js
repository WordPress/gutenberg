/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const BlockNavigationContext = createContext( {
	__experimentalFeatures: false,
	__experimentalPersistentListViewFeatures: false,
} );

export const useBlockNavigationContext = () =>
	useContext( BlockNavigationContext );
