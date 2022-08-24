/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const RootReferenceDocumentContext = createContext( undefined );
export const useRootReferenceDocument = () =>
	useContext( RootReferenceDocumentContext );
export const RootReferenceDocumentProvider =
	RootReferenceDocumentContext.Provider;
