import type { CSSProperties } from 'react';
import {
	ColorSpace,
	clone,
	equals,
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
import type { ThemeProviderProps } from './types';

type Entry = [ string, string ];

const getCachedBgRamp = memoize( buildBgRamp, { maxSize: 10 } );
const getCachedAccentRamp = memoize( buildAccentRamp, { maxSize: 10 } );

// Compares two color strings for visual equivalence, so any parseable
// representation of the same color matches (e.g. `#3858E9` ≡ `#3858e9` ≡
// `rgb(56 88 233)`). Returns `false` for inputs that can't be parsed, letting
// callers treat them as "changed" and surface the descriptive parse error
// downstream when the ramps are computed.
function colorsMatch( a: string, b: string ): boolean {
	try {
		// Register sRGB inline (idempotent) to keep the module top level free
		// of side effects. See #77653.
		ColorSpace.register( sRGB );
		return equals( a, b );
	} catch {
		return false;
	}
}

function customRgbFormat( color: PlainColorObject ): string {
	const rgb = to( color, sRGB );
	return rgb.coords
		.map( ( n ) => Math.round( ( n ?? 0 ) * 255 ) )
		.join( ', ' );
}

function legacyWpAdminThemeOverridesCSS( accent: string ): Entry[] {
	// Register sRGB inline (idempotent) to keep the module top level free of
	// side effects. See #77653.
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

	// Inherited values come from the closest parent provider, or — at the top
	// of the tree, where there is no parent — from the prebuilt `:root`
	// defaults.
	const inheritedPrimary =
		inheritedSettings.color?.primary ?? DEFAULT_SEED_COLORS.primary;
	const inheritedBackground =
		inheritedSettings.color?.background ?? DEFAULT_SEED_COLORS.background;
	const inheritedCursorControl = inheritedSettings.cursor?.control;

	// Resolve each setting: explicit prop wins, then the inherited value.
	const primary = color.primary ?? inheritedPrimary;
	const background = color.background ?? inheritedBackground;
	const cursorControl = cursor?.control ?? inheritedCursorControl;
	// `cornerRadius` is applied independently of the emitted style (as a data
	// attribute on the provider element), so it only needs resolving here for
	// propagation to descendants through context.
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

	// Whether each resolved value differs from what the cascade already
	// provides. Emitting overrides identical to the inherited values would be
	// redundant, so the work is skipped in that case. The comparison is against
	// the *inherited* values (not the prebuilt defaults) so a nested provider
	// can still reset a setting back to the default and win over an ancestor's
	// override.
	const primaryChanged = ! colorsMatch( primary, inheritedPrimary );
	const backgroundChanged = ! colorsMatch( background, inheritedBackground );
	const cursorChanged = cursorControl !== inheritedCursorControl;

	const colorStyles = useMemo( () => {
		if ( ! primaryChanged && ! backgroundChanged ) {
			return undefined;
		}

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

		return Object.fromEntries(
			[
				colorTokensCSS( computedColorRamps ),
				// Only pin `--wp-admin-theme-color*` when the primary differs
				// from the inherited value; otherwise leave the inherited (or
				// surrounding WP admin) color scheme in place.
				primaryChanged
					? legacyWpAdminThemeOverridesCSS( seeds.primary )
					: [],
			].flat()
		);
	}, [ primary, background, primaryChanged, backgroundChanged ] );

	const themeProviderStyles: CSSProperties | undefined = useMemo( () => {
		if ( ! primaryChanged && ! backgroundChanged && ! cursorChanged ) {
			return undefined;
		}
		return {
			...colorStyles,
			...( cursorControl && {
				'--wpds-cursor-control': cursorControl,
			} ),
		};
	}, [
		colorStyles,
		cursorControl,
		primaryChanged,
		backgroundChanged,
		cursorChanged,
	] );

	return {
		resolvedSettings,
		themeProviderStyles,
	};
}
