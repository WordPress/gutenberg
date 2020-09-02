// let strings = {}

// export function getString( key ) {
//     console.log("Requestiong key: ", key, strings);
//     return strings[key];
// }

// export const addStrings = ( newStrings ) => {
//     strings = { ...strings, ...newStrings };
//     console.log("New String: ", strings);
// };

/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const UIStringsContext = createContext( {} );

export const useUIStrings = () => {
	const uiStrings = useContext( UIStringsContext );

	return uiStrings;
};

export const withUIStrings = ( WrappedComponent ) => ( props ) => (
	<UIStringsContext.Consumer>
		{ ( uiStrings ) => (
			<WrappedComponent { ...props } uiStrings={ uiStrings } />
		) }
	</UIStringsContext.Consumer>
);
