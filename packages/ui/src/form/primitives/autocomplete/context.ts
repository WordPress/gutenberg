import { createContext, useContext } from '@wordpress/element';

export const AutocompleteGridContext = createContext( false );

export const useAutocompleteGridContext = () =>
	useContext( AutocompleteGridContext );

export const AutocompletePopupContext = createContext( false );

export const useAutocompletePopupContext = () =>
	useContext( AutocompletePopupContext );
