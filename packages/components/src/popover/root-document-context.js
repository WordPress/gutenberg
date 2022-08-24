/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const RootDocumentContext = createContext( undefined );
export const useRootDocumentContext = () => useContext( RootDocumentContext );
export const RootDocumentProvider = RootDocumentContext.Provider;
