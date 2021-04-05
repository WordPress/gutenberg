/**
 * WordPress dependencies
 */
import { useReducer } from '@wordpress/element';

/** @typedef {{ type: 'SET_THEME', theme: string }} SetThemeAction */

/**
 * @param {string} theme
 * @return {SetThemeAction} The set theme action.
 */
export const setTheme = ( theme ) => ( {
	type: 'SET_THEME',
	theme,
} );

/**
 * @param {{ theme: string }} state
 * @param {SetThemeAction} action
 */
const reducer = ( state, action ) => {
	switch ( action.type ) {
		case 'SET_THEME': {
			return {
				...state,
				theme: action.theme,
			};
		}
		default: {
			return state;
		}
	}
};

const useThemeStylesStore = ( initialTheme = '' ) => {
	return useReducer( reducer, { theme: initialTheme } );
};

export default useThemeStylesStore;
