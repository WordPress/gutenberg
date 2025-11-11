/**
 * External dependencies
 */
import { defineConfig } from '@terrazzo/cli';
import pluginCSS from '@terrazzo/plugin-css';
import { makeCSSVar } from '@terrazzo/token-tools/css';

/**
 * Internal dependencies
 */
import pluginFigmaDsTokenManager from './bin/terrazzo-plugin-figma-ds-token-manager/index';
import pluginKnownWpdsCssVariables from './bin/terrazzo-plugin-known-wpds-css-variables/index';
import pluginDsTokenDocs from './bin/terrazzo-plugin-ds-tokens-docs/index';
import inlineAliasValues from './bin/terrazzo-plugin-inline-alias-values/index';
import { publicTokenId } from './src/token-id.ts';

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
			pattern: /^color\.primitive\./,
			filename: 'ts/color-tokens.ts',
			tokenId: ( tokenId ) =>
				publicTokenId( tokenId )
					.replace( /^color\./, '' )
					.replace( /\./g, '-' ),
		} ),
		inlineAliasValues( { pattern: /^dimension\.primitive\./ } ),
		pluginCSS( {
			filename: 'css/design-tokens.css',
			variableName: ( token ) =>
				makeCSSVar( `wpds.${ publicTokenId( token.id ) }` ),
			baseSelector: ':root',
			modeSelectors: [
				{
					mode: 'high-dpi',
					selectors: [
						'@media ( -webkit-min-device-pixel-ratio: 2 ), ( min-resolution: 192dpi )',
					],
				},
			],
			legacyHex: true,
		} ),
		pluginFigmaDsTokenManager( {
			filename: 'json/figma.json',
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
