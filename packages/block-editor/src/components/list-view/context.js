/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const ListViewContext = createContext( {} );

export const useListViewContext = () => useContext( ListViewContext );
