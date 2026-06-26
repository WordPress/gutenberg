import type { GlobalStylesConfig } from '../types';

export const DEFAULT_VIEWPORT_BREAKPOINTS = {
	mobile: '480px',
	tablet: '782px',
};

type ViewportBreakpoint = keyof typeof DEFAULT_VIEWPORT_BREAKPOINTS;
type ViewportState = `@${ ViewportBreakpoint }`;
type ViewportSettings = Partial< Record< ViewportBreakpoint, string > >;

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
): Record< ViewportBreakpoint, string > {
	const viewportSettings = getViewportSettings( configOrSettings );
	const breakpoints = { ...DEFAULT_VIEWPORT_BREAKPOINTS };

	Object.keys( DEFAULT_VIEWPORT_BREAKPOINTS ).forEach( ( breakpoint ) => {
		const key = breakpoint as ViewportBreakpoint;
		const value = viewportSettings[ key ];
		if ( isValidViewportSize( value ) ) {
			breakpoints[ key ] = value.trim();
		}
	} );

	return breakpoints;
}

export function getResponsiveMediaQueries(
	configOrSettings?: GlobalStylesConfig | ViewportSettings
): Record< ViewportState, string > {
	const breakpoints = getViewportBreakpoints( configOrSettings );

	return {
		'@mobile': `@media (width <= ${ breakpoints.mobile })`,
		'@tablet': `@media (${ breakpoints.mobile } < width <= ${ breakpoints.tablet })`,
	};
}
