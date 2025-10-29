/**
 * External dependencies
 */
import type { CSSProperties } from 'react';
import Color from 'colorjs.io';

/**
 * WordPress dependencies
 */
import { useMemo, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ThemeContext } from './context';
import semanticVariables from './prebuilt/ts/design-tokens';
import {
	buildBgRamp,
	buildAccentRamp,
	DEFAULT_SEED_COLORS,
	type RampResult,
} from './color-ramps';
import type { ThemeProviderProps } from './types';

type Entry = [ string, string ];

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

function customRgbFormat( color: Color ) {
	const rgb = color.to( 'srgb' );
	return [ rgb.r, rgb.g, rgb.b ]
		.map( ( n ) => Math.round( n * 255 ) )
		.join( ', ' );
}

function legacyWpAdminThemeOverridesCSS( accent: string ): Entry[] {
	const parsedAccent = new Color( accent ).to( 'hsl' );

	const hsl = parsedAccent.coords;
	const darker10 = new Color( 'hsl', [
		hsl[ 0 ], // h
		hsl[ 1 ], // s
		Math.max( 0, Math.min( 100, hsl[ 2 ] - 5 ) ), // l (reduced by 5%)
	] ).to( 'srgb' );
	const darker20 = new Color( 'hsl', [
		hsl[ 0 ], // h
		hsl[ 1 ], // s
		Math.max( 0, Math.min( 100, hsl[ 2 ] - 10 ) ), // l (reduced by 10%)
	] ).to( 'srgb' );

	return [
		[
			'--wp-admin-theme-color',
			parsedAccent.to( 'srgb' ).toString( { format: 'hex' } ),
		],
		[ '--wp-admin-theme-color--rgb', customRgbFormat( parsedAccent ) ],
		[
			'--wp-admin-theme-color-darker-10',
			darker10.toString( { format: 'hex' } ),
		],
		[
			'--wp-admin-theme-color-darker-10--rgb',
			customRgbFormat( darker10 ),
		],
		[
			'--wp-admin-theme-color-darker-20',
			darker20.toString( { format: 'hex' } ),
		],
		[
			'--wp-admin-theme-color-darker-20--rgb',
			customRgbFormat( darker20 ),
		],
	];
}

function semanticTokensCSS(
	filterFn: ( entry: [ string, Record< string, string > ] ) => boolean = () =>
		true
): Entry[] {
	return Object.entries( semanticVariables )
		.filter( filterFn )
		.map( ( [ variableName, modesAndValues ] ) => [
			variableName,
			modesAndValues[ '.' ],
		] );
}

const toKebabCase = ( str: string ) =>
	str.replace(
		/[A-Z]+(?![a-z])|[A-Z]/g,
		( $, ofs ) => ( ofs ? '-' : '' ) + $.toLowerCase()
	);

function colorRampCSS( ramp: RampResult, prefix: string ): Entry[] {
	return [ ...Object.entries( ramp.ramp ) ].map(
		( [ tokenName, tokenValue ] ) => [
			`${ prefix }${ toKebabCase( tokenName ) }`,
			tokenValue.color,
		]
	);
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
			// Primitive tokens
			Array.from( computedColorRamps )
				.map( ( [ rampName, computedColorRamp ] ) => [
					colorRampCSS(
						computedColorRamp,
						`--wpds-color-private-${ rampName }-`
					),
				] )
				.flat( 2 ),
			// Semantic color tokens (other semantic tokens for now are static)
			semanticTokensCSS( ( [ key ] ) => /color/.test( key ) ),
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
		const bgRamp = buildBgRamp( { seed: seeds.bg } );
		Object.entries( seeds ).forEach( ( [ rampName, seed ] ) => {
			if ( rampName === 'bg' ) {
				computedColorRamps.set( rampName, bgRamp );
			} else {
				computedColorRamps.set(
					rampName,
					buildAccentRamp( {
						seed,
						bgRamp,
					} )
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
