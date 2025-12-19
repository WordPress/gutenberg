/**
 * External dependencies
 */
import { defineConfig } from '@terrazzo/cli';
import pluginCSS from '@terrazzo/plugin-css';
import { makeCSSVar } from '@terrazzo/token-tools/css';

/**
 * Internal dependencies
 */
import pluginModeOverrides from './bin/terrazzo-plugin-mode-overrides/index';
import pluginKnownWpdsCssVariables from './bin/terrazzo-plugin-known-wpds-css-variables/index';
import pluginDsTokenDocs from './bin/terrazzo-plugin-ds-tokens-docs/index';
import inlineAliasValues from './bin/terrazzo-plugin-inline-alias-values/index';
import typescriptTypes from './bin/terrazzo-plugin-typescript-types/index';

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
		typescriptTypes( {
			filename: 'ts/token-types.ts',
			types: [
				{
					name: 'PaddingSize',
					description: 'Size scale for padding tokens.',
					patterns: [ /^wpds-dimension\.padding\.[^.]+\.([^.]+)$/ ],
				},
				{
					name: 'GapSize',
					description: 'Size scale for gap tokens.',
					patterns: [ /^wpds-dimension\.gap\.([^.]+)$/ ],
				},
				{
					name: 'BorderRadiusSize',
					description: 'Size scale for border radius tokens.',
					patterns: [ /^wpds-border\.radius\.[^.]+\.([^.]+)$/ ],
				},
				{
					name: 'BorderWidthSize',
					description: 'Size scale for border width tokens.',
					patterns: [ /^wpds-border\.width\.surface\.([^.]+)$/ ],
				},
				{
					name: 'Target',
					description:
						'Target elements that tokens can be applied to.',
					patterns: [
						/^wpds-color\.[^.]+\.([^.]+)\./,
						/^wpds-dimension\.[^.]+\.([^.]+)\./,
						/^wpds-border\.[^.]+\.([^.]+)\./,
					],
				},
				{
					name: 'SurfaceBackgroundColor',
					description:
						'Background color variants for surface elements.',
					patterns: [
						{
							pattern: /^wpds-color\.bg\.surface\.(.+)$/,
							transform: ( variant ) =>
								variant.split( '.' ).join( '-' ),
						},
					],
				},
				{
					name: 'InteractiveBackgroundColor',
					description:
						'Background color variants for interactive elements.',
					patterns: [
						{
							pattern: /^wpds-color\.bg\.interactive\.(.+)$/,
							transform: ( variant ) =>
								variant
									.split( '.' )
									.join( '-' )
									.replace( /-(active|disabled)$/, '' ),
						},
					],
				},
				{
					name: 'ContentForegroundColor',
					description:
						'Foreground color variants for content text and icons.',
					patterns: [
						{
							pattern: /^wpds-color\.fg\.content\.(.+)$/,
							transform: ( variant ) =>
								variant.split( '.' ).join( '-' ),
						},
					],
				},
				{
					name: 'InteractiveForegroundColor',
					description:
						'Foreground color variants for interactive element text and icons.',
					patterns: [
						{
							pattern: /^wpds-color\.fg\.interactive\.(.+)$/,
							transform: ( variant ) =>
								variant
									.split( '.' )
									.join( '-' )
									.replace( /-(active|disabled)$/, '' ),
						},
					],
				},
				{
					name: 'SurfaceStrokeColor',
					description: 'Stroke color variants for surface borders.',
					patterns: [
						{
							pattern: /^wpds-color\.stroke\.surface\.(.+)$/,
							transform: ( variant ) =>
								variant.split( '.' ).join( '-' ),
						},
					],
				},
				{
					name: 'InteractiveStrokeColor',
					description:
						'Stroke color variants for interactive element borders.',
					patterns: [
						{
							pattern: /^wpds-color\.stroke\.interactive\.(.+)$/,
							transform: ( variant ) =>
								variant
									.split( '.' )
									.join( '-' )
									.replace( /-(active|disabled)$/, '' ),
						},
					],
				},
			],
		} ),
		pluginModeOverrides(),
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
