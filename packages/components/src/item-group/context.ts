/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ItemGroupContext as Context } from './types';

export const ItemGroupContext = createContext( {
	size: 'medium',
} as Context );

export const useItemGroupContext = () => useContext( ItemGroupContext );
