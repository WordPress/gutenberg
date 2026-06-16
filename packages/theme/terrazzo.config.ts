import { defineConfig, type Config } from '@terrazzo/parser';
import pluginCSS from '@terrazzo/plugin-css';
import { makeCSSVar } from '@terrazzo/token-tools/css';
import pluginModeOverrides from './bin/terrazzo-plugin-mode-overrides/index';
import pluginKnownWpdsCssVariables from './bin/terrazzo-plugin-known-wpds-css-variables/index';
import pluginDsTokenDocs from './bin/terrazzo-plugin-ds-tokens-docs/index';
import pluginDsTokenFallbacks from './bin/terrazzo-plugin-ds-token-fallbacks/index';
import inlineAliasValues from './bin/terrazzo-plugin-inline-alias-values/index';
import typescriptTypes from './bin/terrazzo-plugin-typescript-types/index';

const config: Config = {
	tokens: [
		'./tokens/border.json',
		'./tokens/color.json',
		'./tokens/cursor.json',
		'./tokens/dimension.json',
		'./tokens/elevation.json',
		'./tokens/motion.json',
		'./tokens/typography.json',
	],
	outDir: './src/prebuilt',

	// Preserve source ordering of tokens in output. This is important because
	// many of our tokens operate on a size scale (2xs → 2xl) and it's more easy
	// to understand that size progression in the original order.
	alphabetize: false,

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
					token.id.startsWith( 'wpds-typography.font-weight.' ) &&
					token.$value === 500
				) {
					return '499';
				}

				return undefined;
			},
			baseSelector: ':root',
			modeSelectors: [
				{
					mode: 'high-dpi',
					selectors: [
						'@media ( -webkit-min-device-pixel-ratio: 2 ), ( min-resolution: 192dpi )',
					],
				},
				// Each corner-radius preset is applied via the
				// `data-wpds-corner-radius` attribute that `ThemeProvider`
				// sets on its scoping element. The additional
				// `:root:has([data-wpds-root-provider="true"]…)` selector lets
				// a root `ThemeProvider` forward its preset to the document
				// element, matching how `color` and `cursor` tokens already
				// behave so the whole token surface stays consistent on
				// `<html>` (e.g. for PHP-rendered admin UI outside the React
				// app).
				{
					mode: 'corner-radius-none',
					selectors: [
						'[data-wpds-corner-radius="none"]',
						':root:has([data-wpds-root-provider="true"][data-wpds-corner-radius="none"])',
					],
				},
				{
					mode: 'corner-radius-subtle',
					selectors: [
						'[data-wpds-corner-radius="subtle"]',
						':root:has([data-wpds-root-provider="true"][data-wpds-corner-radius="subtle"])',
					],
				},
				{
					mode: 'corner-radius-moderate',
					selectors: [
						'[data-wpds-corner-radius="moderate"]',
						':root:has([data-wpds-root-provider="true"][data-wpds-corner-radius="moderate"])',
					],
				},
				{
					mode: 'corner-radius-pronounced',
					selectors: [
						'[data-wpds-corner-radius="pronounced"]',
						':root:has([data-wpds-root-provider="true"][data-wpds-corner-radius="pronounced"])',
					],
				},
			],
			legacyHex: true,
		} ),
		pluginKnownWpdsCssVariables( {
			filename: 'js/design-tokens.mjs',
		} ),
		pluginDsTokenFallbacks( {
			filename: 'js/design-token-fallbacks.mjs',
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
					name: 'ElementSize',
					description: 'Size scale for element sizing tokens.',
					patterns: [ /^wpds-dimension\.size\.([^.]+)$/ ],
				},
				{
					name: 'SurfaceWidthSize',
					description: 'Size scale for surface width tokens.',
					patterns: [ /^wpds-dimension\.surface-width\.([^.]+)$/ ],
				},
				{
					name: 'DurationSize',
					description: 'Size scale for duration tokens.',
					patterns: [ /^wpds-motion\.duration\.([^.]+)$/ ],
				},
				{
					name: 'Easing',
					description: 'Easing curve variants.',
					patterns: [ /^wpds-motion\.easing\.([^.]+)$/ ],
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
							pattern: /^wpds-color\.background\.surface\.(.+)$/,
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
							pattern:
								/^wpds-color\.background\.interactive\.(.+)$/,
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
							pattern: /^wpds-color\.foreground\.content\.(.+)$/,
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
							pattern:
								/^wpds-color\.foreground\.interactive\.(.+)$/,
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
							pattern: /^wpds-color\.foreground\.[^.]+\.(.+)$/,
							transform: ( variant ) =>
								variant.split( '.' ).join( '-' ),
						},
					],
				},
				{
					name: 'FontFamily',
					description: 'Font family variants.',
					patterns: [ /^wpds-typography\.font-family\.([^.]+)$/ ],
				},
				{
					name: 'FontSize',
					description: 'Font size scale.',
					patterns: [ /^wpds-typography\.font-size\.([^.]+)$/ ],
				},
				{
					name: 'FontWeight',
					description: 'Font weight variants.',
					patterns: [ /^wpds-typography\.font-weight\.([^.]+)$/ ],
				},
				{
					name: 'LineHeight',
					description: 'Line height scale.',
					patterns: [ /^wpds-typography\.line-height\.([^.]+)$/ ],
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
};

export default defineConfig( config, {
	cwd: new URL( './', import.meta.url ),
} );
