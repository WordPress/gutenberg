/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const stringsToAdd = [];

export const addStrings = ( newStrings ) => stringsToAdd.unshift( newStrings );

const getStrings = () =>
	stringsToAdd.reduce( ( previous, current ) => {
		return { ...previous, ...current() };
	}, {} );

export const UIStringsContext = createContext( {} );

export const useUIStrings = () => useContext( UIStringsContext );

export const withUIStrings = ( WrappedComponent ) => ( props ) => (
	<UIStringsContext.Consumer>
		{ () => <WrappedComponent { ...props } uiStrings={ getStrings() } /> }
	</UIStringsContext.Consumer>
);
