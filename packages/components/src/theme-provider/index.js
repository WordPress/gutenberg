/**
 * External dependencies
 */
import { ThemeProvider } from 'emotion-theming';

export { useTheme } from 'emotion-theming';

/**
 * WordPress dependencies
 */
import { adminColorSchemes } from '@wordpress/base-styles';

/**
 * Internal dependencies
 */
import colors from '../utils/colors-values';

export const getTheme = ( theme ) => ( {
	fontSizes: {
		small: 11,
		default: 13,
		medium: 18,
		big: 22,
	},
	space: {
		small: 4,
		medium: 8,
		large: 16,
		xlarge: 24,
		iconButtonSize: 36,
		iconButtonSizeSmall: 24,
		borderWidth: 1,
	},
	zIndices: {
		'block-library-gallery-item__inline-menu': 20,
	},
	colors: {
		...( adminColorSchemes.themes[ theme || '' ] ||
			adminColorSchemes.defaults ),
		...colors,
	},
	helpers: {
		shade: ( inputColor, amount ) => {
			return (
				'#' +
				inputColor
					.replace( /^#/, '' )
					.replace( /../g, ( color ) =>
						(
							'0' +
							Math.min(
								255,
								Math.max( 0, parseInt( color, 16 ) + amount )
							).toString( 16 )
						).substr( -2 )
					)
			);
		},
	},
} );

export default ( { theme, children } ) => (
	<ThemeProvider theme={ getTheme( theme ) }>{ children }</ThemeProvider>
);
