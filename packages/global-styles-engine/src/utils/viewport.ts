import type { GlobalStylesConfig } from '../types';

export const DEFAULT_VIEWPORT_BREAKPOINTS = {
	mobile: '480px',
	tablet: '782px',
};

type ViewportBreakpoint = keyof typeof DEFAULT_VIEWPORT_BREAKPOINTS;
type ViewportState = `@${ ViewportBreakpoint }`;
type ViewportSettings = Partial< Record< ViewportBreakpoint, string > >;

const VIEWPORT_SIZE_REGEXP = /^(?:\d+|\d*\.\d+)(?:px|em|rem)$/;

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
