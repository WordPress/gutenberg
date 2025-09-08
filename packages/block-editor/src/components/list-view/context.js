/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const ListViewContext = createContext( {} );
ListViewContext.displayName = 'ListViewContext';

export const useListViewContext = () => useContext( ListViewContext );
