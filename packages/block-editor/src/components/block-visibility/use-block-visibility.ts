import { useMediaQuery } from '@wordpress/compose';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import type { BlockVisibilityViewport } from './constants';
import { unlock } from '../../lock-unlock';

/**
 * Viewport breakpoints keyed by viewport. Desktop has no breakpoint: it
 * applies above the largest configured one.
 */
type ViewportBreakpoints = Partial< Record< 'mobile' | 'tablet', string > >;

/**
 * Block visibility metadata: `false` hides the block on all viewports,
 * per-viewport `false` flags hide it on specific viewports.
 */
export type BlockVisibility =
	| boolean
	| {
			viewport?: Partial< Record< BlockVisibilityViewport, boolean > >;
	  };

const { getViewportBreakpoints } = unlock< {
	getViewportBreakpoints: (
		viewportSettings?: ViewportBreakpoints
	) => ViewportBreakpoints;
} >( globalStylesEnginePrivateApis );

type UseBlockVisibilityOptions = {
	blockVisibility?: BlockVisibility;
	deviceType?: BlockVisibilityViewport;
	viewportSettings?: ViewportBreakpoints;
	view?: Window;
};

/**
 * Returns information about the current block visibility state.
 *
 * @param options                  Parameters to avoid extra store subscriptions.
 * @param options.blockVisibility  Block visibility metadata.
 * @param options.deviceType       Current device type.
 * @param options.viewportSettings Viewport breakpoint settings.
 * @param options.view             Window instance in which to perform viewport matching.
 * @return Object with `isBlockCurrentlyHidden` and `currentViewport` properties.
 */
export default function useBlockVisibility( {
	blockVisibility,
	deviceType = 'desktop',
	viewportSettings,
	view = window,
}: UseBlockVisibilityOptions = {} ): {
	isBlockCurrentlyHidden: boolean;
	currentViewport: BlockVisibilityViewport;
} {
	const viewportBreakpoints = getViewportBreakpoints( viewportSettings );
	const mobileMediaQuery = viewportBreakpoints.mobile
		? `(width <= ${ viewportBreakpoints.mobile })`
		: undefined;
	const isMobileViewport = useMediaQuery( mobileMediaQuery, view );
	let tabletMediaQuery;
	if ( viewportBreakpoints.tablet ) {
		tabletMediaQuery = viewportBreakpoints.mobile
			? `(${ viewportBreakpoints.mobile } < width <= ${ viewportBreakpoints.tablet })`
			: `(width <= ${ viewportBreakpoints.tablet })`;
	}
	const isTabletViewport = useMediaQuery( tabletMediaQuery, view );

	/*
	 * Priority:
	 * 1. Device type override (Mobile/Tablet) - uses device type to determine viewport
	 * 2. Actual window size (Desktop mode) - uses viewport detection
	 */
	let currentViewport: BlockVisibilityViewport;
	if ( deviceType === 'mobile' && viewportBreakpoints.mobile ) {
		currentViewport = 'mobile';
	} else if ( deviceType === 'tablet' && viewportBreakpoints.tablet ) {
		currentViewport = 'tablet';
	} else if ( isMobileViewport ) {
		currentViewport = 'mobile';
	} else if ( isTabletViewport && viewportBreakpoints.tablet ) {
		currentViewport = 'tablet';
	} else {
		currentViewport = 'desktop';
	}

	// Determine if block is currently hidden.
	const isBlockCurrentlyHidden =
		blockVisibility === false ||
		( typeof blockVisibility === 'object' &&
			blockVisibility?.viewport?.[ currentViewport ] === false );

	return { isBlockCurrentlyHidden, currentViewport };
}
