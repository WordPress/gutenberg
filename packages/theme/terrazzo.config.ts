import { defineConfig, type Config } from '@terrazzo/parser';
import pluginCSS from '@terrazzo/plugin-css';
import { makeCSSVar } from '@terrazzo/token-tools/css';
import pluginModeOverrides from './bin/terrazzo-plugin-mode-overrides/index';
import pluginKnownWpdsCssVariables from './bin/terrazzo-plugin-known-wpds-css-variables/index';
import pluginDsTokenDocs from './bin/terrazzo-plugin-ds-tokens-docs/index';
import pluginDsTokenFallbacks from './bin/terrazzo-plugin-ds-token-fallbacks/index';
import inlineAliasValues from './bin/terrazzo-plugin-inline-alias-values/index';
import typescriptTypes from './bin/terrazzo-plugin-typescript-types/index';
import { SEMANTIC_COLOR_CONTRAST_PAIRS } from './src/semantic-color-contrast-pairs';

const config: Config = {
	tokens: [
		'./tokens/border.json',
		'./tokens/color.json',
		'./tokens/cursor.json',
		'./tokens/dimension.json',
		'./tokens/motion.json',
		'./tokens/typography.json',
	],
	outDir: '.',

	// Preserve source ordering of tokens in output. This is important because
	// many of our tokens operate on a size scale (2xs → 2xl) and it's more easy
	// to understand that size progression in the original order.
	alphabetize: false,

	plugins: [
		inlineAliasValues( {
			pattern: /^wpds-color\.primitive\./,
			filename: 'src/prebuilt/ts/color-tokens.ts',
			tokenId: ( tokenId ) =>
				tokenId
					.replace( /\.primitive/, '' )
					.replace( /^wpds-color\./, '' )
					.replace( /\./g, '-' ),
		} ),
		inlineAliasValues( { pattern: /^wpds-dimension\.primitive\./ } ),
		pluginCSS( {
			filename: 'prebuilt/css/design-tokens.css',
			variableName: ( token ) => makeCSSVar( token.id ),
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
				// sets on its scoping element. A root `ThemeProvider` mirrors
				// its preset attributes directly to the document element so
				// the whole token surface stays consistent on `<html>` (e.g.
				// for PHP-rendered admin UI outside the React app).
				{
					mode: 'corner-radius-none',
					selectors: [
						'[data-wpds-corner-radius="none"]',
						':root[data-wpds-root-provider="true"][data-wpds-corner-radius="none"]',
					],
				},
				{
					mode: 'corner-radius-subtle',
					selectors: [
						'[data-wpds-corner-radius="subtle"]',
						':root[data-wpds-root-provider="true"][data-wpds-corner-radius="subtle"]',
					],
				},
				{
					mode: 'corner-radius-moderate',
					selectors: [
						'[data-wpds-corner-radius="moderate"]',
						':root[data-wpds-root-provider="true"][data-wpds-corner-radius="moderate"]',
					],
				},
				{
					mode: 'corner-radius-pronounced',
					selectors: [
						'[data-wpds-corner-radius="pronounced"]',
						':root[data-wpds-root-provider="true"][data-wpds-corner-radius="pronounced"]',
					],
				},
			],
			legacyHex: true,
		} ),
		pluginKnownWpdsCssVariables( {
			filename: 'prebuilt/js/design-tokens.mjs',
		} ),
		pluginDsTokenFallbacks( {
			filename: 'prebuilt/js/design-token-fallbacks.mjs',
			scssFilename: false,
			additionalScssFilenames: [
				'../base-styles/internal/_wpds-token-fallbacks.scss',
			],
		} ),
		pluginDsTokenDocs( {
			filename: 'docs/tokens.md',
		} ),
		typescriptTypes( {
			filename: 'src/prebuilt/ts/token-types.ts',
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
	lint: {
		rules: {
			'a11y/min-contrast': [
				'error',
				{
					level: 'AA',
					pairs: SEMANTIC_COLOR_CONTRAST_PAIRS.map(
						( { foreground, background } ) => ( {
							foreground: `wpds-color.${ foreground }`,
							background: `wpds-color.${ background }`,
						} )
					),
				},
			],
			// Primitive color names are generated outside this package and use
			// camelCase names that do not match Terrazzo's kebab-case default.
			'core/consistent-naming': [ 'off', {} ],
		},
	},
};

export default defineConfig( config, {
	cwd: new URL( './', import.meta.url ),
} );
