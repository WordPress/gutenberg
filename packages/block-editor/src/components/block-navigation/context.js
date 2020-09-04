/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const BlockNavigationFeaturesContext = createContext( false );
export const useBlockNavigationFeaturesContext = () =>
	useContext( BlockNavigationFeaturesContext );

export const BlockNavigationDropTargetContext = createContext( {} );
export const useBlockNavigationDropTargetContext = () =>
	useContext( BlockNavigationDropTargetContext );
