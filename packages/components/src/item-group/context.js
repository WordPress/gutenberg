/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const ItemGroupContext = createContext( { size: 'medium' } );
export const useItemGroupContext = () => useContext( ItemGroupContext );
