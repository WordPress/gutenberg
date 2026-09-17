/**
 * Derives design token values from a set of seed colors, without React.
 *
 * `ThemeProvider` applies the result as inline custom properties on its
 * wrapper. Consumers that render outside React (build scripts, wp-admin
 * screens with no provider) need the same values as plain data, so this module
 * owns the derivation and the provider is one of its callers.
 */

import {
	ColorSpace,
	clone,
	set,
	to,
	sRGB,
	HSL,
	type PlainColorObject,
} from 'colorjs.io/fn';
import memoize from 'memize';
import colorTokens from './prebuilt/ts/color-tokens.ts';
import {
	buildBgRamp,
	buildAccentRamp,
	DEFAULT_SEED_COLORS,
	type RampResult,
} from './color-ramps/index.ts';
import { getColorString } from './color-ramps/lib/color-utils.ts';
import {
	collectThemeProviderColorWarnings,
	type ThemeProviderColorRampName,
	type ThemeProviderColorWarning,
} from './theme-provider-color-warnings.ts';

/**
 * A CSS custom property name, and a map keyed by one. Keeping the key type
 * narrower than `string` lets React accept the result as inline styles without
 * a cast.
 */
type CustomPropertyName = `--${ string }`;
export type CustomProperties = Record< CustomPropertyName, string >;

type Entry = [ CustomPropertyName, string ];

function toCustomProperties( entries: Entry[] ): CustomProperties {
	const properties: CustomProperties = {};

	for ( const [ name, value ] of entries ) {
		properties[ name ] = value;
	}

	return properties;
}

// `getCachedAccentRamp` includes the `bgRamp` object reference in its cache key.
// Without memoizing background ramps, accent ramp memoization would not work at all.
const getCachedBgRamp = memoize( buildBgRamp, { maxSize: 10 } );
const getCachedAccentRamp = memoize( buildAccentRamp, { maxSize: 10 } );

const legacyWpComponentsOverridesCSS: Entry[] = [
	[ '--wp-components-color-accent', 'var(--wp-admin-theme-color)' ],
	[
		'--wp-components-color-accent-darker-10',
		'var(--wp-admin-theme-color-darker-10)',
	],
	[
		'--wp-components-color-accent-darker-20',
		'var(--wp-admin-theme-color-darker-20)',
	],
	[
		'--wp-components-color-accent-inverted',
		'var(--wpds-color-foreground-interactive-brand-strong)',
	],
	[
		'--wp-components-color-background',
		'var(--wpds-color-background-surface-neutral-strong)',
	],
	[
		'--wp-components-color-foreground',
		'var(--wpds-color-foreground-content-neutral)',
	],
	[
		'--wp-components-color-foreground-inverted',
		'var(--wpds-color-background-surface-neutral)',
	],
	[
		'--wp-components-color-gray-100',
		'var(--wpds-color-background-surface-neutral)',
	],
	[
		'--wp-components-color-gray-200',
		'var(--wpds-color-stroke-surface-neutral)',
	],
	[
		'--wp-components-color-gray-300',
		'var(--wpds-color-stroke-surface-neutral)',
	],
	[
		'--wp-components-color-gray-400',
		'var(--wpds-color-stroke-interactive-neutral)',
	],
	[
		'--wp-components-color-gray-600',
		'var(--wpds-color-stroke-interactive-neutral)',
	],
	[
		'--wp-components-color-gray-700',
		'var(--wpds-color-foreground-content-neutral-weak)',
	],
	[
		'--wp-components-color-gray-800',
		'var(--wpds-color-foreground-content-neutral)',
	],
];

function customRgbFormat( color: PlainColorObject ): string {
	const rgb = to( color, sRGB );
	return rgb.coords
		.map( ( n ) => Math.round( ( n ?? 0 ) * 255 ) )
		.join( ', ' );
}

function legacyWpAdminThemeOverridesCSS( accent: string ): Entry[] {
	ColorSpace.register( sRGB );
	const parsedAccent = to( accent, HSL );
	const parsedL = parsedAccent.coords[ 2 ] ?? 0;

	// Create darker version of accent —
	const darker10 = set(
		clone( parsedAccent ),
		[ HSL, 'l' ],
		Math.max( 0, parsedL - 5 ) // L reduced by 5%
	);
	const darker20 = set(
		clone( parsedAccent ),
		[ HSL, 'l' ],
		Math.max( 0, parsedL - 10 ) // L reduced by 10%
	);

	return [
		[ '--wp-admin-theme-color', getColorString( parsedAccent ) ],
		[ '--wp-admin-theme-color--rgb', customRgbFormat( parsedAccent ) ],
		[ '--wp-admin-theme-color-darker-10', getColorString( darker10 ) ],
		[
			'--wp-admin-theme-color-darker-10--rgb',
			customRgbFormat( darker10 ),
		],
		[ '--wp-admin-theme-color-darker-20', getColorString( darker20 ) ],
		[
			'--wp-admin-theme-color-darker-20--rgb',
			customRgbFormat( darker20 ),
		],
	];
}

function colorTokensCSS(
	computedColorRamps: Map< ThemeProviderColorRampName, RampResult >
): Entry[] {
	const entries: Entry[] = [];

	for ( const [ rampName, { ramp } ] of computedColorRamps ) {
		for ( const [ tokenName, tokenValue ] of Object.entries( ramp ) ) {
			const primitiveRampName =
				rampName === 'background' ? 'bg' : rampName;
			const key = `${ primitiveRampName }-${ tokenName }`;
			const aliasedBy = colorTokens[ key ] ?? [];
			for ( const aliasedId of aliasedBy ) {
				entries.push( [ `--wpds-color-${ aliasedId }`, tokenValue ] );
			}
		}
	}

	return entries;
}

/**
 * Seed colors for a generated theme. Each seed accepts a fully opaque
 * sRGB-parseable string: a hex value (e.g. `#3858e9`), an `rgb()`/`rgba()`
 * string, or a CSS named color (e.g. `'blue'`). An omitted seed falls back to
 * the design system's default.
 */
export interface ColorTokenSeeds {
	/**
	 * The primary seed color.
	 */
	primary?: string;
	/**
	 * The background seed color.
	 */
	background?: string;
}

export interface ColorTokenResult {
	/**
	 * Design token values, keyed by custom property name
	 * (e.g. `--wpds-color-background-surface-neutral`).
	 */
	tokens: CustomProperties;
	/**
	 * WordPress compatibility values, keyed by custom property name
	 * (e.g. `--wp-admin-theme-color`). These are not design tokens: they exist
	 * so that styles predating the design system pick up the generated colors,
	 * and they are expected to go away. Apply them only where those older
	 * styles are in play, and only where nothing else already defines them.
	 */
	compatibility: CustomProperties;
	/**
	 * Generated ramp steps and semantic foreground/background pairs that miss
	 * their contrast targets. Empty when every checked target is met.
	 */
	warnings: ThemeProviderColorWarning[];
}

/**
 * Derives every color token value from a set of seed colors.
 *
 * This is the derivation `ThemeProvider` applies to a React subtree, as plain
 * data. Use it to produce the same values where a provider cannot run, such as
 * a build step emitting a stylesheet, or a screen rendered without React.
 *
 * The result carries custom property names and values only. Choosing where
 * they apply, whether that is a selector, a cascade layer, or an inline style,
 * is left to the caller.
 *
 * @param seeds Seed colors. Omitted seeds use the design system's defaults.
 *
 * @example
 * ```js
 * const { tokens } = generateColorTokens( { primary: '#d63638' } );
 * // => { '--wpds-color-background-interactive-brand-strong': '...', ... }
 * ```
 *
 * @return The generated tokens, compatibility values, and contrast warnings.
 */
export function generateColorTokens(
	seeds: ColorTokenSeeds = {}
): ColorTokenResult {
	const resolvedSeeds = {
		...DEFAULT_SEED_COLORS,
		primary: seeds.primary ?? DEFAULT_SEED_COLORS.primary,
		background: seeds.background ?? DEFAULT_SEED_COLORS.background,
	};
	const computedColorRamps = new Map<
		ThemeProviderColorRampName,
		RampResult
	>();
	const bgRamp = getCachedBgRamp( resolvedSeeds.background );

	for ( const [ rawRampName, seed ] of Object.entries( resolvedSeeds ) ) {
		const rampName = rawRampName as ThemeProviderColorRampName;
		computedColorRamps.set(
			rampName,
			rampName === 'background'
				? bgRamp
				: getCachedAccentRamp( seed, bgRamp )
		);
	}

	const colorEntries = colorTokensCSS( computedColorRamps );

	return {
		tokens: toCustomProperties( colorEntries ),
		compatibility: toCustomProperties( [
			...legacyWpAdminThemeOverridesCSS( resolvedSeeds.primary ),
			...legacyWpComponentsOverridesCSS,
		] ),
		warnings: collectThemeProviderColorWarnings(
			computedColorRamps,
			new Map( colorEntries )
		),
	};
}
