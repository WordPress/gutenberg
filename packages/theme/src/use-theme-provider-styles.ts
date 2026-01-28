/**
 * External dependencies
 */
import type { CSSProperties } from 'react';
import {
	clone,
	set,
	to,
	sRGB,
	HSL,
	type PlainColorObject,
} from 'colorjs.io/fn';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { useMemo, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './color-ramps/lib/register-color-spaces';
import { ThemeContext } from './context';
import colorTokens from './prebuilt/ts/color-tokens';
import {
	buildBgRamp,
	buildAccentRamp,
	DEFAULT_SEED_COLORS,
	type RampResult,
} from './color-ramps';
import { getColorString } from './color-ramps/lib/color-utils';
import type { ThemeProviderProps } from './types';

type Entry = [ string, string ];

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
		'var(--wpds-color-fg-interactive-brand-strong)',
	],
	[
		'--wp-components-color-background',
		'var(--wpds-color-bg-surface-neutral-strong)',
	],
	[
		'--wp-components-color-foreground',
		'var(--wpds-color-fg-content-neutral)',
	],
	[
		'--wp-components-color-foreground-inverted',
		'var(--wpds-color-bg-surface-neutral)',
	],
	[
		'--wp-components-color-gray-100',
		'var(--wpds-color-bg-surface-neutral)',
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
		'var(--wpds-color-fg-content-neutral-weak)',
	],
	[
		'--wp-components-color-gray-800',
		'var(--wpds-color-fg-content-neutral)',
	],
];

function customRgbFormat( color: PlainColorObject ): string {
	const rgb = to( color, sRGB );
	return rgb.coords
		.map( ( n ) => Math.round( ( n ?? 0 ) * 255 ) )
		.join( ', ' );
}

function legacyWpAdminThemeOverridesCSS( accent: string ): Entry[] {
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
	computedColorRamps: Map< string, RampResult >
): Entry[] {
	const entries: Entry[] = [];

	for ( const [ rampName, { ramp } ] of computedColorRamps ) {
		for ( const [ tokenName, tokenValue ] of Object.entries( ramp ) ) {
			const key = `${ rampName }-${ tokenName }`;
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
	computedColorRamps,
}: {
	primary: string;
	computedColorRamps: Map< string, RampResult >;
} ): CSSProperties {
	return Object.fromEntries(
		[
			// Semantic color tokens
			colorTokensCSS( computedColorRamps ),
			// Legacy overrides
			legacyWpAdminThemeOverridesCSS( primary ),
			legacyWpComponentsOverridesCSS,
		].flat()
	);
}

export function useThemeProviderStyles( {
	color = {},
}: {
	color?: ThemeProviderProps[ 'color' ];
} = {} ) {
	const { resolvedSettings: inheritedSettings } = useContext( ThemeContext );

	// Compute settings:
	// - used provided prop value;
	// - otherwise, use inherited value from parent instance;
	// - otherwise, use fallback value (where applicable).
	const primary =
		color.primary ??
		inheritedSettings.color?.primary ??
		DEFAULT_SEED_COLORS.primary;
	const bg =
		color.bg ?? inheritedSettings.color?.bg ?? DEFAULT_SEED_COLORS.bg;

	const resolvedSettings = useMemo(
		() => ( {
			color: {
				primary,
				bg,
			},
		} ),
		[ primary, bg ]
	);

	const themeProviderStyles = useMemo( () => {
		// Determine which seeds are needed for generating ramps.
		const seeds = {
			...DEFAULT_SEED_COLORS,
			bg,
			primary,
		};

		// Generate ramps.
		const computedColorRamps = new Map< string, RampResult >();
		const bgRamp = getCachedBgRamp( seeds.bg );
		Object.entries( seeds ).forEach( ( [ rampName, seed ] ) => {
			if ( rampName === 'bg' ) {
				computedColorRamps.set( rampName, bgRamp );
			} else {
				computedColorRamps.set(
					rampName,
					getCachedAccentRamp( seed, bgRamp )
				);
			}
		} );

		return generateStyles( {
			primary: seeds.primary,
			computedColorRamps,
		} );
	}, [ primary, bg ] );

	return {
		resolvedSettings,
		themeProviderStyles,
	};
}
