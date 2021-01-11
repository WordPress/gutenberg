/**
 * External dependencies
 */
import { createContext, useContext, useRef } from 'react';
import { isNil } from 'lodash';

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
 * @property {boolean | null} isDark Whether dark mode is enabled.
 * @property {boolean | null} isColorBlind Whether color blind mode is enabled.
 * @property {boolean | null} isReducedMotion Whether reduced motion is enabled.
 * @property {boolean | null} isHighContrast Whether high contrast mode is enabled.
 */

/** @type {ThemeProviderContext} */
const DEFAULT_THEME_PROVIDER_CONTEXT = {
	isDark: null,
	isColorBlind: null,
	isReducedMotion: null,
	isHighContrast: null,
};

export const ThemeProviderContext = createContext(
	DEFAULT_THEME_PROVIDER_CONTEXT
);

export const useThemeProviderContext = () => useContext( ThemeProviderContext );

/**
 * Combines parent ThemeProvider context values with the current ThemeProvider
 * context values. This mechanism allows for "mode" settings to cascade
 * throughout the React component render tree.
 *
 * @param {ThemeProviderContext} currentContextState
 */
export function useThemeProviderContextBridge(
	currentContextState = DEFAULT_THEME_PROVIDER_CONTEXT
) {
	const parentThemeProviderContextState = useThemeProviderContext();
	const nextContextState = useRef( {
		...parentThemeProviderContextState,
	} ).current;

	for ( const [ key, value ] of Object.entries( currentContextState ) ) {
		if ( ! isNil( value ) ) {
			nextContextState[
				/** @type {keyof ThemeProviderContext} */ ( key )
			] = value;
		}
	}

	return nextContextState;
}

/**
 * Creates HTML attributes corresponding to ThemeProvider modes.
 *
 * @param {ThemeProviderContext} currentContextState
 */
export function useThemeProviderModeHtmlAttributes(
	currentContextState = DEFAULT_THEME_PROVIDER_CONTEXT
) {
	const {
		isColorBlind,
		isDark,
		isHighContrast,
		isReducedMotion,
	} = currentContextState;

	/** @type {Record<string, boolean | string>} */
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
