import type { GlobalStylesConfig } from '../types';

export const DEFAULT_VIEWPORT_BREAKPOINTS = {
	mobile: '480px',
	tablet: '782px',
};

type ViewportBreakpoint = keyof typeof DEFAULT_VIEWPORT_BREAKPOINTS;
type ViewportSettings = Partial< Record< ViewportBreakpoint, string > >;
type ViewportBreakpoints = {
	mobile: string;
	tablet?: string;
};

// Matches positive CSS length values supported for viewport breakpoints, and
// captures the numeric value and unit for conversion to pixels.
const VIEWPORT_SIZE_REGEXP = /^(\d+|\d*\.\d+)(px|em|rem)$/;
const DEFAULT_FONT_SIZE = 16;

function isViewportSettings(
	configOrSettings: GlobalStylesConfig | ViewportSettings
): configOrSettings is ViewportSettings {
	return 'mobile' in configOrSettings || 'tablet' in configOrSettings;
}

function getViewportSettings(
	configOrSettings?: GlobalStylesConfig | ViewportSettings
): ViewportSettings {
	if ( ! configOrSettings || typeof configOrSettings !== 'object' ) {
		return {};
	}

	if ( isViewportSettings( configOrSettings ) ) {
		return configOrSettings;
	}

	return configOrSettings.settings?.viewport ?? {};
}

function isValidViewportSize( value: unknown ): value is string {
	return (
		typeof value === 'string' && VIEWPORT_SIZE_REGEXP.test( value.trim() )
	);
}

export function getViewportBreakpointValueInPixels(
	value: number | string | undefined
): number | undefined {
	if ( typeof value === 'number' ) {
		return value;
	}

	if ( typeof value !== 'string' ) {
		return undefined;
	}

	const match = value.trim().match( VIEWPORT_SIZE_REGEXP );
	if ( ! match ) {
		return undefined;
	}

	const numericValue = Number.parseFloat( match[ 1 ] );
	const unit = match[ 2 ];

	return unit === 'px' ? numericValue : numericValue * DEFAULT_FONT_SIZE;
}

export function getViewportBreakpoints(
	configOrSettings?: GlobalStylesConfig | ViewportSettings
): ViewportBreakpoints {
	const viewportSettings = getViewportSettings( configOrSettings );
	const breakpoints: Partial< Record< ViewportBreakpoint, string > > = {};

	Object.keys( DEFAULT_VIEWPORT_BREAKPOINTS ).forEach( ( breakpoint ) => {
		const key = breakpoint as ViewportBreakpoint;
		const value = viewportSettings[ key ];
		if ( isValidViewportSize( value ) ) {
			breakpoints[ key ] = value.trim();
		}
	} );

	if ( ! breakpoints.mobile && ! breakpoints.tablet ) {
		return { ...DEFAULT_VIEWPORT_BREAKPOINTS };
	}

	if ( ! breakpoints.mobile ) {
		return { mobile: breakpoints.tablet as string };
	}

	if ( ! breakpoints.tablet ) {
		return { mobile: breakpoints.mobile };
	}

	const mobileBreakpoint = getViewportBreakpointValueInPixels(
		breakpoints.mobile
	);
	const tabletBreakpoint = getViewportBreakpointValueInPixels(
		breakpoints.tablet
	);

	if (
		mobileBreakpoint === undefined ||
		tabletBreakpoint === undefined ||
		mobileBreakpoint >= tabletBreakpoint
	) {
		return { mobile: breakpoints.mobile };
	}

	return {
		mobile: breakpoints.mobile,
		tablet: breakpoints.tablet,
	};
}

export function getResponsiveMediaQueries(
	configOrSettings?: GlobalStylesConfig | ViewportSettings
): Record< string, string > {
	const breakpoints = getViewportBreakpoints( configOrSettings );
	const mediaQueries: Record< string, string > = {
		'@mobile': `@media (width <= ${ breakpoints.mobile })`,
	};

	if ( breakpoints.tablet ) {
		mediaQueries[
			'@tablet'
		] = `@media (${ breakpoints.mobile } < width <= ${ breakpoints.tablet })`;
	}

	return mediaQueries;
}
