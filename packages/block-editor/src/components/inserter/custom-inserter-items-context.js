/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const CustomInserterItemsContext = createContext( [] );

export const CustomInserterItemsProvider = CustomInserterItemsContext.Provider;
export const useCustomInserterItems = () =>
	useContext( CustomInserterItemsContext );
