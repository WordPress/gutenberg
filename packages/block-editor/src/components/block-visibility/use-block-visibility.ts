import { useMediaQuery } from '@wordpress/compose';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import type { BlockVisibilityViewport } from './constants';
import { getSavedViewportRanges, getViewportRangeMediaQuery } from './ranges';
import type {
	BlockVisibility,
	ViewportRange,
	ViewportSettings,
} from './ranges';
import { unlock } from '../../lock-unlock';

/**
 * Viewport breakpoints keyed by viewport. Desktop has no breakpoint: it
 * applies above the largest configured one.
 */
export type ViewportBreakpoints = ViewportSettings;
export type { BlockVisibility } from './ranges';

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
 * Returns the viewport the block visibility rules apply to.
 *
 * @param options                  Parameters to avoid extra store subscriptions.
 * @param options.deviceType       Current device type.
 * @param options.viewportSettings Viewport breakpoint settings.
 * @param options.view             Window instance in which to perform viewport matching.
 * @return The current viewport.
 */
export function useCurrentViewport( {
	deviceType = 'desktop',
	viewportSettings,
	view = window,
}: Omit<
	UseBlockVisibilityOptions,
	'blockVisibility'
> = {} ): BlockVisibilityViewport {
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
	if ( deviceType === 'mobile' && viewportBreakpoints.mobile ) {
		return 'mobile';
	} else if ( deviceType === 'tablet' && viewportBreakpoints.tablet ) {
		return 'tablet';
	} else if ( isMobileViewport ) {
		return 'mobile';
	} else if ( isTabletViewport && viewportBreakpoints.tablet ) {
		return 'tablet';
	}
	return 'desktop';
}

/**
 * Returns whether a block is hidden in the given viewport.
 *
 * @param blockVisibility Block visibility metadata.
 * @param currentViewport The current viewport.
 * @return Whether the block is hidden.
 */
export function isBlockHidden(
	blockVisibility: BlockVisibility | undefined,
	currentViewport: BlockVisibilityViewport
): boolean {
	return (
		blockVisibility === false ||
		( typeof blockVisibility === 'object' &&
			blockVisibility?.viewport?.[ currentViewport ] === false )
	);
}

export function useViewportRangeVisibility(
	ranges: ViewportRange[],
	view?: Window
): boolean {
	const query = ranges.map( getViewportRangeMediaQuery ).join( ', ' );
	const matches = useMediaQuery( query || undefined, view );
	return !! query && matches;
}

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
	...options
}: UseBlockVisibilityOptions = {} ): {
	isBlockCurrentlyHidden: boolean;
	isHiddenByRange: boolean;
	currentViewport: BlockVisibilityViewport;
} {
	const currentViewport = useCurrentViewport( options );
	const isHiddenByRange = useViewportRangeVisibility(
		getSavedViewportRanges( blockVisibility ),
		options.view
	);
	return {
		isBlockCurrentlyHidden:
			isHiddenByRange ||
			isBlockHidden( blockVisibility, currentViewport ),
		isHiddenByRange,
		currentViewport,
	};
}
