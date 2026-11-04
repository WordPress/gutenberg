import { createContext, useContext } from '@wordpress/element';

export const AutocompleteGridContext = createContext( false );

export const useAutocompleteGridContext = () =>
	useContext( AutocompleteGridContext );
