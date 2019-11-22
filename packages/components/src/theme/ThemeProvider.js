/**
 * External dependencies
 */
import { ThemeProvider as EmotionThemeProvider } from 'emotion-theming';

/**
 * Internal dependencies
 */
import { fontFamily } from './font-family';

/**
 * @typedef {{}} Theme
 * @property {{}} color
 */

/**
 * @typedef {{}} ThemeProviderProps
 * @property {Theme} theme
 * @property {React.ReactElement}
 */

/**
 * @type {Theme}
 */

const defaultTheme = {
	fonts: [ fontFamily ],
	fontSizes: [ 12, 14, 16, 20, 24, 32 ],
	lineHeights: [ `16px`, `20px`, `24px`, `28px`, `32px`, `40px` ],
	fontWeights: [ 400, 600, 700 ],
};

/**
 *
 * @param {ThemeProviderProps} props
 */
export const ThemeProvider = ( { theme, children } ) => (
	<EmotionThemeProvider theme={ theme || defaultTheme }>
		{ children }
	</EmotionThemeProvider>
);
