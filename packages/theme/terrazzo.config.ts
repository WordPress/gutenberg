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
			// See: https://github.com/terrazzoapp/terrazzo/pull/632
			// @ts-expect-error - Valid return types excluded from package types.
			transform( token ) {
				// This addresses a specific browser issue where Chrome renders
				// a font-weight of 500 as 600 instead of 400 when the target
				// weight is not locally available, which is inconsistent with
				// the spec-defined behavior. This workaround ensures that a 400
				// weight is used if the 500 weight is not locally available,
				// while still using the 500 weight if it _is_ available. This
				// is applied at the plugin layer to ensure the original token
				// value can be preserved at the intended 500 weight, where the
				// bug only occurs in specific browser rendering.
				//
				// See: https://issues.chromium.org/issues/40552893
				// See: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-weight#fallback_weights
				if (
					token.id.startsWith( 'wpds-font.weight.' ) &&
					token.$value === 500
				) {
					return '499';
				}
			},
			baseSelector: ':root',
			modeSelectors: [
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
					tokens: [ 'wpds-dimension.*' ],
					mode: '.',
					selectors: [
						"[data-wpds-theme-provider-id][data-wpds-density='default']",
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
			filename: 'js/design-tokens.mjs',
		} ),
		pluginDsTokenDocs( {
			filename: '../../docs/tokens.md',
		} ),
		typescriptTypes( {
			filename: 'ts/token-types.ts',
			types: [
				{
					name: 'PaddingSize',
					description: 'Size scale for padding tokens.',
					patterns: [ /^wpds-dimension\.padding\.([^.]+)$/ ],
				},
				{
					name: 'GapSize',
					description: 'Size scale for gap tokens.',
					patterns: [ /^wpds-dimension\.gap\.([^.]+)$/ ],
				},
				{
					name: 'BorderRadiusSize',
					description: 'Size scale for border radius tokens.',
					patterns: [ /^wpds-border\.radius\.([^.]+)$/ ],
				},
				{
					name: 'BorderWidthSize',
					description: 'Size scale for border width tokens.',
					patterns: [ /^wpds-border\.width\.([^.]+)$/ ],
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
				{
					name: 'ForegroundColor',
					description: 'Foreground color variants for text elements.',
					patterns: [
						{
							pattern: /^wpds-color\.fg\.[^.]+\.(.+)$/,
							transform: ( variant ) =>
								variant.split( '.' ).join( '-' ),
						},
					],
				},
				{
					name: 'FontFamily',
					description: 'Font family variants.',
					patterns: [ /^wpds-font\.family\.([^.]+)$/ ],
				},
				{
					name: 'FontSize',
					description: 'Font size scale.',
					patterns: [ /^wpds-font\.size\.([^.]+)$/ ],
				},
				{
					name: 'FontWeight',
					description: 'Font weight variants.',
					patterns: [ /^wpds-font\.weight\.([^.]+)$/ ],
				},
				{
					name: 'LineHeight',
					description: 'Line height scale.',
					patterns: [ /^wpds-font\.line-height\.([^.]+)$/ ],
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
