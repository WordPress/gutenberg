/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const ItemGroupContext = createContext( { size: 'medium' } as {
	size: 'small' | 'medium' | 'large';
} );

export const useItemGroupContext = () => useContext( ItemGroupContext );
