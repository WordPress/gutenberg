import type { GlobalStylesConfig } from '../types';

const DEFAULT_VIEWPORT_BREAKPOINTS = {
	mobile: '480px',
	tablet: '782px',
};

type ViewportBreakpoint = keyof typeof DEFAULT_VIEWPORT_BREAKPOINTS;
type ViewportSettings = Partial< Record< ViewportBreakpoint, string > >;
type ViewportBreakpoints = Partial< Record< ViewportBreakpoint, string > >;

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

/**
 * Converts a viewport breakpoint value to pixels.
 *
 * Numeric values are returned as-is. CSS length values are only supported when
 * expressed in px, em, or rem units.
 *
 * @param value Breakpoint value as a number or CSS length.
 * @return The breakpoint value in pixels, or undefined when invalid.
 */
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

	// Use the most common browser default font size as the base for em/rem
	// media query conversions. This pixel value is used to compare breakpoint
	// order and calculate preview sizes; generated media queries keep the
	// original units.
	return unit === 'px' ? numericValue : numericValue * DEFAULT_FONT_SIZE;
}

/**
 * Returns sanitized viewport breakpoints keyed by viewport state.
 *
 * Falls back to default breakpoints when no valid values are provided. If the
 * mobile breakpoint is missing, a valid tablet breakpoint remains keyed as
 * tablet so the editor can present it as a tablet breakpoint. If the tablet
 * breakpoint is missing, invalid, or not larger than the mobile breakpoint, the
 * result only includes the mobile breakpoint.
 *
 * @param configOrSettings Global styles config or viewport settings.
 * @return Sanitized viewport breakpoints.
 */
export function getViewportBreakpoints(
	configOrSettings?: GlobalStylesConfig | ViewportSettings
): ViewportBreakpoints {
	const viewportSettings = getViewportSettings( configOrSettings );
	const breakpoints: ViewportBreakpoints = {};
	const breakpointValuesInPixels: Partial<
		Record< ViewportBreakpoint, number >
	> = {};

	Object.keys( DEFAULT_VIEWPORT_BREAKPOINTS ).forEach( ( breakpoint ) => {
		const key = breakpoint as ViewportBreakpoint;
		const value = viewportSettings[ key ];
		const px = getViewportBreakpointValueInPixels( value );
		if ( px !== undefined && isValidViewportSize( value ) ) {
			breakpoints[ key ] = value.trim();
			breakpointValuesInPixels[ key ] = px;
		}
	} );

	const breakpointNames = Object.keys( breakpoints );
	if ( ! breakpointNames.length ) {
		return { ...DEFAULT_VIEWPORT_BREAKPOINTS };
	}

	if ( 1 === breakpointNames.length ) {
		return breakpoints;
	}

	const mobile = breakpoints.mobile!;
	const tablet = breakpoints.tablet!;
	if (
		breakpointValuesInPixels.mobile! >= breakpointValuesInPixels.tablet!
	) {
		return { mobile };
	}

	return { mobile, tablet };
}

/**
 * Returns responsive media query aliases for the configured viewport
 * breakpoints.
 *
 * @param configOrSettings Global styles config or viewport settings.
 * @return Responsive media queries keyed by alias.
 */
export function getResponsiveMediaQueries(
	configOrSettings?: GlobalStylesConfig | ViewportSettings
): Record< string, string > {
	const breakpoints = getViewportBreakpoints( configOrSettings );
	const mediaQueries: Record< string, string > = {};

	if ( breakpoints.mobile ) {
		mediaQueries[ '@mobile' ] = `@media (width <= ${ breakpoints.mobile })`;
	}

	if ( breakpoints.tablet ) {
		mediaQueries[ '@tablet' ] = breakpoints.mobile
			? `@media (${ breakpoints.mobile } < width <= ${ breakpoints.tablet })`
			: `@media (width <= ${ breakpoints.tablet })`;
	}

	return mediaQueries;
}
