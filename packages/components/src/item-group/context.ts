import { createContext, useContext } from '@wordpress/element';
import type { ItemGroupContext as Context } from './types';

export const ItemGroupContext = createContext( {
	size: 'medium',
} as Context );
ItemGroupContext.displayName = 'ItemGroupContext';

export const useItemGroupContext = () => useContext( ItemGroupContext );
