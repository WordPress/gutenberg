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
import { ThemeContext } from './context';
import colorTokens from './prebuilt/ts/color-tokens';
import {
	buildBgRamp,
	buildAccentRamp,
	DEFAULT_SEED_COLORS,
	type RampResult,
} from './color-ramps';
import { getColorString } from './color-ramps/lib/color-utils';
import { legacyWpComponentsRuntimeColorAliasEntries } from './legacy-color-aliases';
import type { ThemeProviderProps } from './types';

type Entry = [ string, string ];

// `getCachedAccentRamp` includes the `bgRamp` object reference in its cache key.
// Without memoizing background ramps, accent ramp memoization would not work at all.
const getCachedBgRamp = memoize( buildBgRamp, { maxSize: 10 } );
const getCachedAccentRamp = memoize( buildAccentRamp, { maxSize: 10 } );

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
			legacyWpComponentsRuntimeColorAliasEntries,
		].flat()
	);
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

	// Compute settings:
	// - used provided prop value;
	// - otherwise, use inherited value from parent instance;
	// - otherwise, use fallback value (where applicable).
	const primary =
		color.primary ??
		inheritedSettings.color?.primary ??
		DEFAULT_SEED_COLORS.primary;
	const background =
		color.background ??
		inheritedSettings.color?.background ??
		DEFAULT_SEED_COLORS.background;
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

	const colorStyles = useMemo( () => {
		// Determine which seeds are needed for generating ramps.
		const seeds = {
			...DEFAULT_SEED_COLORS,
			background,
			primary,
		};

		// Generate ramps, keyed by their primitive token group name. The
		// `background` seed maps to the `bg` primitive ramp group, whose name
		// is kept abbreviated even though the semantic tokens it feeds are
		// exposed under the spelled-out `background` group.
		const computedColorRamps = new Map< string, RampResult >();
		const bgRamp = getCachedBgRamp( seeds.background );
		Object.entries( seeds ).forEach( ( [ rampName, seed ] ) => {
			if ( rampName === 'background' ) {
				computedColorRamps.set( 'bg', bgRamp );
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
	}, [ primary, background ] );

	const themeProviderStyles: CSSProperties = useMemo(
		() => ( {
			...colorStyles,
			...( cursorControl && {
				'--wpds-cursor-control': cursorControl,
			} ),
		} ),
		[ colorStyles, cursorControl ]
	);

	return {
		resolvedSettings,
		themeProviderStyles,
	};
}
