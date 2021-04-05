/**
 * WordPress dependencies
 */
import { createContext, useContext, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	COLOR_BLIND_MODE_ATTR_PROP,
	DARK_MODE_ATTR_PROP,
	HIGH_CONTRAST_MODE_ATTR_PROP,
	REDUCED_MOTION_MODE_ATTR_PROP,
} from '../../create-style-system/constants';

/**
 * @typedef ThemeProviderContext
 * @property {boolean | null} [isDark] Whether dark mode is enabled.
 * @property {boolean | null} [isColorBlind] Whether color blind mode is enabled.
 * @property {boolean | null} [isReducedMotion] Whether reduced motion is enabled.
 * @property {boolean | null} [isHighContrast] Whether high contrast is enabled.
 */

export const ThemeProviderContext = createContext(
	/** @type {ThemeProviderContext} */ ( {
		isDark: null,
		isColorBlind: null,
		isReducedMotion: null,
		isHighContrast: null,
	} )
);

export const useThemeProviderContext = () => useContext( ThemeProviderContext );

/**
 * Combines parent ThemeProvider context values with the current ThemeProvider
 * context values. This mechanism allows for "mode" settings to cascade
 * throughout the React component render tree.
 *
 * @param {ThemeProviderContext} currentContextState
 */
export function useThemeProviderContextBridge( currentContextState = {} ) {
	const parentThemeProviderContextState = useThemeProviderContext();
	const nextContextState = useRef( {
		...parentThemeProviderContextState,
	} ).current;

	Object.entries( currentContextState ).forEach( ( [ key, value ] ) => {
		if ( typeof value !== 'undefined' ) {
			nextContextState[
				/** @type {keyof ThemeProviderContext} */ ( key )
			] = value;
		}
	} );

	return nextContextState;
}

/**
 * Creates HTML attributes corresponding to ThemeProvider modes.
 *
 * @param {ThemeProviderContext} currentContextState
 * @return {Record<string, string | boolean>} HTML attributes to apply for the current theme provider context state.
 */
export function useThemeProviderModeHtmlAttributes( currentContextState = {} ) {
	const {
		isColorBlind,
		isDark,
		isHighContrast,
		isReducedMotion,
	} = currentContextState;

	/** @type {Record<string, string | boolean>} */
	const htmlAttrs = {};

	if ( isDark ) {
		htmlAttrs[ DARK_MODE_ATTR_PROP ] = 'dark';
	}
	if ( isHighContrast ) {
		htmlAttrs[ HIGH_CONTRAST_MODE_ATTR_PROP ] = true;
	}
	if ( isColorBlind ) {
		htmlAttrs[ COLOR_BLIND_MODE_ATTR_PROP ] = true;
	}
	if ( isReducedMotion ) {
		htmlAttrs[ REDUCED_MOTION_MODE_ATTR_PROP ] = true;
	}

	return htmlAttrs;
}
