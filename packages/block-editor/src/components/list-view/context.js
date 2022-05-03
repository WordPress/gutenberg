/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const ListViewContext = createContext( {
	__experimentalPersistentListViewFeatures: false,
} );

export const useListViewContext = () => useContext( ListViewContext );
