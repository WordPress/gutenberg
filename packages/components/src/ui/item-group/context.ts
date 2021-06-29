/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export type ItemGroupContext = {
	spacedAround: boolean;
	size: 'small' | 'medium' | 'large';
};

export const ItemGroupContext = createContext( {
	size: 'medium',
} as ItemGroupContext );

export const useItemGroupContext = () => useContext( ItemGroupContext );
