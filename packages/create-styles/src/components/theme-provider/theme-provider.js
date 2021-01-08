/**
 * External dependencies
 */
import mergeRefs from 'react-merge-refs';
import { repeat } from 'lodash';
import React, { useRef } from 'react';

/**
 * Internal dependencies
 */
import {
	DARK_HIGH_CONTRAST_MODE_MODE_ATTR,
	DARK_MODE_ATTR,
	HIGH_CONTRAST_MODE_MODE_ATTR,
	MODE_SPECIFICITY_COMPOUND_LEVEL,
} from '../../create-style-system/constants';
import { useHydrateGlobalStyles } from '../../hooks';
import {
	ThemeProviderContext,
	useThemeProviderContextBridge,
	useThemeProviderModeHtmlAttributes,
} from './theme-provider-context';
import {
	useColorBlindMode,
	useDarkMode,
	useHighContrastMode,
	useReducedMotionMode,
	useThemeStyles,
} from './utils';

/**
 * @typedef ThemeProviderProps
 * @property {import('react').ReactNode} children Children to render.
 * @property {import('../../create-compiler').Compiler} compiler The style compiler.
 * @property {string} className Optional className to render on the provider.
 * @property {boolean} isGlobal Determines if the theme styles are rendered globally or scoped locally.
 * @property {import('../../create-style-system/generate-theme').GenerateThemeResults} globalStyles Styles to apply globally.
 * @property {boolean} isDark Determines if dark-mode styles should be rendered.
 * @property {boolean} isColorBlind Determines if color-blind-mode styles should be rendered.
 * @property {boolean} isReducedMotion Determines if reduced-motion-mode styles should be rendered.
 * @property {boolean} isHighContrast Determines if high-contrast-mode styles should be rendered.
 * @property {Record<string, string>} theme Custom theme properties.
 * @property {Record<string, string>} darkTheme Custom dark theme properties.
 * @property {Record<string, string>} highContrastTheme Custom high contrast theme properties.
 * @property {Record<string, string>} darkHighContrastTheme Custom dark & high contrast theme properties.
 */

/**
 * The ThemeProvider for the Style system. This ThemeProvider uses Emotion's
 * ThemeProvider as a foundation, but enhances it with features provided by
 * the Style system, such as dark mode, high contrast mode, etc...
 *
 * An important feature this ThemeProvider accounts for is the ability to render
 * styles either globally (at the document/html level) or scoped.
 *
 * @example
 * ```jsx
 * <ThemeProvider isGlobal theme={{...}}>
 * <Button>...</Button>
 * </ThemeProvider>
 * ```
 * @param {ThemeProviderProps} props Props for the ThemeProvider.
 * @param {import('react').Ref<HTMLDivElement>} forwardedRef
 * @return {JSX.Element} Children content wrapped with the <ThemeProvider />.
 */
function ThemeProvider(
	{
		children,
		compiler,
		className,
		isGlobal = false,
		globalStyles,
		isDark,
		isColorBlind,
		isReducedMotion,
		isHighContrast,
		theme = {},
		darkTheme = {},
		highContrastTheme = {},
		darkHighContrastTheme = {},
		...props
	},
	forwardedRef
) {
	const { css, cx, injectGlobal } = compiler;
	/**
	 * Hydrates global styles (via injectGlobal). This is necessary as there may
	 * be a chance that <ThemeProvider /> renders before any other (styled)
	 * component. Injecting global styles early in this manner allows for
	 * the initial render of theme styles (which also uses injectGlobal)
	 * to be sequenced correctly.
	 */
	useHydrateGlobalStyles( { injectGlobal, globalStyles } );

	const nodeRef = useRef();
	const defaultStyles = useThemeStyles( {
		injectGlobal,
		isGlobal,
		theme,
		selector: ':root',
	} );
	const darkStyles = useThemeStyles( {
		injectGlobal,
		isGlobal,
		theme: darkTheme,
		selector: repeat( DARK_MODE_ATTR, MODE_SPECIFICITY_COMPOUND_LEVEL ),
	} );
	const highContrastStyles = useThemeStyles( {
		injectGlobal,
		isGlobal,
		theme: highContrastTheme,
		selector: repeat(
			HIGH_CONTRAST_MODE_MODE_ATTR,
			MODE_SPECIFICITY_COMPOUND_LEVEL
		),
	} );
	const darkHighContrastStyles = useThemeStyles( {
		injectGlobal,
		isGlobal,
		theme: darkHighContrastTheme,
		selector: repeat(
			DARK_HIGH_CONTRAST_MODE_MODE_ATTR,
			MODE_SPECIFICITY_COMPOUND_LEVEL
		),
	} );

	useColorBlindMode( { isColorBlind, isGlobal, ref: nodeRef } );
	useDarkMode( { isDark, isGlobal, ref: nodeRef } );
	useHighContrastMode( { isGlobal, isHighContrast, ref: nodeRef } );
	useReducedMotionMode( { isGlobal, isReducedMotion, ref: nodeRef } );

	const contextState = useThemeProviderContextBridge( {
		isDark,
		isReducedMotion,
		isColorBlind,
		isHighContrast,
	} );

	const modeHtmlAttrs = useThemeProviderModeHtmlAttributes( contextState );

	const classes = cx(
		className,
		css`
			${ defaultStyles }
			${ darkStyles }
			${ highContrastStyles }
			${ darkHighContrastStyles }
		`
	);

	return (
		<div
			{ ...props }
			{ ...modeHtmlAttrs }
			className={ classes }
			data-system-theme-provider
			ref={ mergeRefs( [ forwardedRef, nodeRef ] ) }
		>
			<ThemeProviderContext.Provider value={ contextState }>
				{ children }
			</ThemeProviderContext.Provider>
		</div>
	);
}

export default React.memo( React.forwardRef( ThemeProvider ) );
