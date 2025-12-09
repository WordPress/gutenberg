/**
 * External dependencies
 */
import { defineConfig } from '@terrazzo/cli';
import pluginCSS from '@terrazzo/plugin-css';
import { makeCSSVar } from '@terrazzo/token-tools/css';

/**
 * Internal dependencies
 */
import pluginKnownWpdsCssVariables from './bin/terrazzo-plugin-known-wpds-css-variables/index';
import pluginDsTokenDocs from './bin/terrazzo-plugin-ds-tokens-docs/index';
import inlineAliasValues from './bin/terrazzo-plugin-inline-alias-values/index';

export default defineConfig( {
	tokens: [
		'./tokens/border.json',
		'./tokens/color.json',
		'./tokens/dimension.json',
		'./tokens/elevation.json',
		'./tokens/typography.json',
	],
	outDir: './src/prebuilt',

	plugins: [
		inlineAliasValues( {
			pattern: /^wpds-color\.primitive\./,
			filename: 'ts/color-tokens.ts',
			tokenId: ( tokenId ) =>
				tokenId
					.replace( /\.primitive/, '' )
					.replace( /^wpds-color\./, '' )
					.replace( /\./g, '-' ),
		} ),
		inlineAliasValues( { pattern: /^wpds-dimension\.primitive\./ } ),
		pluginCSS( {
			filename: 'css/design-tokens.css',
			variableName: ( token ) => makeCSSVar( token.id ),
			baseSelector: ':root',
			modeSelectors: [
				{
					tokens: [ 'wpds-dimension.*' ],
					mode: '.',
					selectors: [
						"[data-wpds-theme-provider-id][data-wpds-density='default']",
					],
				},
				{
					tokens: [ 'wpds-dimension.*' ],
					mode: 'compact',
					selectors: [
						"[data-wpds-theme-provider-id][data-wpds-density='compact']",
					],
				},
				{
					tokens: [ 'wpds-dimension.*' ],
					mode: 'comfortable',
					selectors: [
						"[data-wpds-theme-provider-id][data-wpds-density='comfortable']",
					],
				},
				{
					mode: 'high-dpi',
					selectors: [
						'@media ( -webkit-min-device-pixel-ratio: 2 ), ( min-resolution: 192dpi )',
					],
				},
			],
			legacyHex: true,
		} ),
		pluginKnownWpdsCssVariables( {
			filename: 'js/design-tokens.js',
		} ),
		pluginDsTokenDocs( {
			filename: '../../docs/ds-tokens.md',
		} ),
	],

	// Linter rules current error when multiple entry files are used
	// See https://github.com/terrazzoapp/terrazzo/issues/505
	// lint: {
	// 	rules: {
	// 		'a11y/min-contrast': [
	// 			'error',
	// 			{
	// 				level: 'AA',
	// 				pairs: [
	// 					// Standard BG / FG pairs
	// 					...[
	// 						'color.primitive.neutral.1',
	// 						'color.primitive.neutral.2',
	// 						'color.primitive.neutral.3',
	// 						'color.primitive.primary.1',
	// 						'color.primitive.primary.2',
	// 						'color.primitive.primary.3',
	// 					].flatMap( ( bgToken ) =>
	// 						[
	// 							'color.primitive.neutral.11',
	// 							'color.primitive.neutral.12',
	// 							'color.primitive.primary.11',
	// 							'color.primitive.primary.12',
	// 						].map( ( fgToken ) => ( {
	// 							foreground: fgToken,
	// 							background: bgToken,
	// 						} ) )
	// 					),
	// 					// Action pairs (ie. using step 9 as background)
	// 					{
	// 						foreground: 'color.primitive.primary.contrast',
	// 						background: 'color.primitive.primary.9',
	// 					},
	// 					{
	// 						foreground: 'color.primitive.primary.1',
	// 						background: 'color.primitive.primary.9',
	// 					},
	// 				],
	// 			},
	// 		],
	// 	},
	// },
} );
