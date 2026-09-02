import type { CSSProperties } from 'react';
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
import { useMemo, useContext } from '@wordpress/element';
import { ThemeContext } from './context.ts';
import colorTokens from './prebuilt/ts/color-tokens.ts';
import {
	buildBgRamp,
	buildAccentRamp,
	DEFAULT_SEED_COLORS,
	type RampResult,
} from './color-ramps/index.ts';
import { getColorString } from './color-ramps/lib/color-utils.ts';
import type { ThemeProviderProps } from './types.ts';
import {
	collectThemeProviderColorWarnings,
	type ThemeProviderColorRampName,
	type ThemeProviderColorWarning,
} from './theme-provider-color-warnings.ts';

type Entry = [ string, string ];

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

function generateStyles( {
	primary,
	colorEntries,
}: {
	primary: string;
	colorEntries: Entry[];
} ): CSSProperties {
	return Object.fromEntries(
		[
			// Semantic color tokens
			colorEntries,
			// Legacy overrides
			legacyWpAdminThemeOverridesCSS( primary ),
			legacyWpComponentsOverridesCSS,
		].flat()
	);
}

function generateThemeProviderColors(
	primary: string,
	background: string
): {
	styles: CSSProperties;
	warnings: ThemeProviderColorWarning[];
} {
	const seeds = {
		...DEFAULT_SEED_COLORS,
		background,
		primary,
	};
	const computedColorRamps = new Map<
		ThemeProviderColorRampName,
		RampResult
	>();
	const bgRamp = getCachedBgRamp( seeds.background );

	for ( const [ rawRampName, seed ] of Object.entries( seeds ) ) {
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
		styles: generateStyles( {
			primary: seeds.primary,
			colorEntries,
		} ),
		warnings: collectThemeProviderColorWarnings(
			computedColorRamps,
			new Map( colorEntries )
		),
	};
}

export function useThemeProviderStyles( {
	color = {},
	cursor,
	cornerRadius,
}: {
	color?: ThemeProviderProps[ 'color' ];
	cursor?: ThemeProviderProps[ 'cursor' ];
	cornerRadius?: ThemeProviderProps[ 'cornerRadius' ];
} = {} ) {
	const { resolvedSettings: inheritedSettings } = useContext( ThemeContext );

	// Color styles are only emitted when seeds are either applied locally or
	// inherited from an ancestor. Otherwise, the expectation is that static CSS
	// stylesheet, build fallbacks, or CSS properties defined elsewhere apply
	// (e.g. `@wordpress/base-styles`). Inherited seed values must always be
	// reapplied so portaled subtrees retain the values.
	const hasColor =
		color.primary !== undefined ||
		color.background !== undefined ||
		inheritedSettings.color?.primary !== undefined ||
		inheritedSettings.color?.background !== undefined;

	// Compute settings:
	// - used provided prop value;
	// - otherwise, if a parent instance exists, use its inherited value or default;
	// - otherwise, omit.
	const primary = hasColor
		? color.primary ??
		  inheritedSettings.color?.primary ??
		  DEFAULT_SEED_COLORS.primary
		: undefined;
	const background = hasColor
		? color.background ??
		  inheritedSettings.color?.background ??
		  DEFAULT_SEED_COLORS.background
		: undefined;
	const cursorControl = cursor?.control ?? inheritedSettings.cursor?.control;
	const cornerRadiusPreset =
		cornerRadius ?? inheritedSettings.cornerRadius ?? 'subtle';

	const resolvedSettings = useMemo(
		() => ( {
			color: {
				primary,
				background,
			},
			cursor: cursorControl ? { control: cursorControl } : undefined,
			cornerRadius: cornerRadiusPreset,
		} ),
		[ primary, background, cursorControl, cornerRadiusPreset ]
	);

	const generatedColors = useMemo( () => {
		if ( primary === undefined || background === undefined ) {
			return {
				styles: {},
				warnings: undefined,
			};
		}

		return generateThemeProviderColors( primary, background );
	}, [ primary, background ] );

	const themeProviderStyles: CSSProperties = useMemo(
		() => ( {
			...generatedColors.styles,
			...( cursorControl && {
				'--wpds-cursor-control': cursorControl,
			} ),
		} ),
		[ generatedColors.styles, cursorControl ]
	);

	return {
		resolvedSettings,
		themeProviderStyles,
		colorWarnings: generatedColors.warnings,
	};
}
