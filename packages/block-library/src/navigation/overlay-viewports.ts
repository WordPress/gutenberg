import { applyFilters } from '@wordpress/hooks';

/**
 * Viewports, in the order used for generated CSS.
 */
export const OVERLAY_VIEWPORTS = [ 'mobile', 'tablet', 'desktop' ] as const;

export type OverlayViewport = ( typeof OVERLAY_VIEWPORTS )[ number ];

/**
 * Whether the Navigation overlay is shown in each viewport.
 */
export type OverlayViewportMap = Record< OverlayViewport, boolean >;

/**
 * Returns the viewports in which the Navigation overlay is shown.
 *
 * `null` means the default `mobile` behavior, which uses the static 600px
 * rule in style.scss rather than the theme's viewport breakpoints.
 *
 * @param attributes             Block attributes.
 * @param attributes.overlayMenu The `overlayMenu` attribute. Untrusted.
 * @return Viewport map, or `null` for the default `mobile` behavior.
 */
export function getOverlayViewports(
	attributes?: { overlayMenu?: unknown } | null
): OverlayViewportMap | null {
	// No `isResponsive` case: `deprecated.jsx` migrates it before edit.
	switch ( attributes?.overlayMenu ) {
		case 'never':
			return { mobile: false, tablet: false, desktop: false };
		case 'always':
			return { mobile: true, tablet: true, desktop: true };
		case 'tablet':
			return { mobile: true, tablet: true, desktop: false };
		default:
			return null;
	}
}

/**
 * Returns whether a value is a complete viewport map, with a boolean for each
 * of the `mobile`, `tablet` and `desktop` keys.
 *
 * @param value Value to check. Untrusted.
 * @return Whether the value is a viewport map.
 */
function isOverlayViewportMap( value: unknown ): value is OverlayViewportMap {
	return (
		!! value &&
		typeof value === 'object' &&
		! Array.isArray( value ) &&
		OVERLAY_VIEWPORTS.every(
			( viewport ) =>
				typeof ( value as Record< string, unknown > )[ viewport ] ===
				'boolean'
		)
	);
}

/**
 * Returns the viewports in which the Navigation overlay is shown, after
 * plugins have filtered them, for example to collapse a menu whose translated
 * labels are longer at a larger viewport.
 *
 * Applies the `blocks.navigation.overlayViewports` filter. Its callbacks
 * receive these arguments, and must not mutate `attributes`:
 *
 * - The viewport map from `getOverlayViewports()`, or `null` for the default
 *   `mobile` behavior.
 * - The block attributes, including `ref`, the ID of the `wp_navigation` post.
 * - The block client ID.
 *
 * A callback may return a map with a boolean for each of the `mobile`,
 * `tablet` and `desktop` keys, or `null` for the default `mobile` behavior.
 * Any other value is ignored and the unfiltered viewports are used. Only the
 * known keys are copied from a returned map. Note that
 * `{ mobile: true, tablet: false, desktop: false }` differs from `null`: the
 * map collapses at the theme's mobile breakpoint, while `null` uses the fixed
 * 600px rule.
 *
 * The filter is not applied to Navigation blocks inside an overlay, which
 * never show an overlay of their own.
 *
 * The PHP counterpart is the `block_core_navigation_overlay_viewports` filter,
 * whose callbacks receive the viewport map or `null`, the block attributes,
 * and the `WP_Block` instance or `null`.
 *
 * Call it on every render or store change rather than memoizing it on the
 * attributes, since a filter can depend on state outside them, such as the
 * current language.
 *
 * @param attributes              Block attributes.
 * @param attributes.overlayMenu  The `overlayMenu` attribute. Untrusted.
 * @param clientId                Block client ID.
 * @param options                 Options.
 * @param options.isWithinOverlay Whether the block is inside a Navigation
 *                                overlay.
 * @return Viewport map, or `null` for the default `mobile` behavior.
 */
export function getFilteredOverlayViewports(
	attributes: { overlayMenu?: unknown; [ key: string ]: unknown },
	clientId: string,
	{ isWithinOverlay = false }: { isWithinOverlay?: boolean } = {}
): OverlayViewportMap | null {
	if ( isWithinOverlay ) {
		return getOverlayViewports( { overlayMenu: 'never' } );
	}
	const overlayViewports = getOverlayViewports( attributes );
	const filtered: unknown = applyFilters(
		'blocks.navigation.overlayViewports',
		overlayViewports,
		attributes,
		clientId
	);
	if ( filtered === null ) {
		return null;
	}
	if ( isOverlayViewportMap( filtered ) ) {
		return {
			mobile: filtered.mobile,
			tablet: filtered.tablet,
			desktop: filtered.desktop,
		};
	}
	return overlayViewports;
}

/**
 * Returns whether the overlay is shown in at least one viewport.
 *
 * The default `mobile` behavior (`null`) is responsive. Only the `mobile`,
 * `tablet` and `desktop` keys are read, and a viewport shows the overlay only
 * when its value is strictly `true`.
 *
 * @param overlayViewports Viewport map from `getOverlayViewports()`.
 * @return Whether the overlay is shown in at least one viewport.
 */
export function isOverlayResponsive(
	overlayViewports: Partial< OverlayViewportMap > | null
): boolean {
	return (
		overlayViewports === null ||
		OVERLAY_VIEWPORTS.some(
			( viewport ) => overlayViewports[ viewport ] === true
		)
	);
}

/**
 * Returns whether the overlay is shown in every viewport.
 *
 * Only the `mobile`, `tablet` and `desktop` keys are read, and a viewport shows
 * the overlay only when its value is strictly `true`.
 *
 * @param overlayViewports Viewport map from `getOverlayViewports()`.
 * @return Whether the overlay is shown in every viewport.
 */
export function isOverlayAlwaysShown(
	overlayViewports: Partial< OverlayViewportMap > | null
): boolean {
	return (
		overlayViewports !== null &&
		OVERLAY_VIEWPORTS.every(
			( viewport ) => overlayViewports[ viewport ] === true
		)
	);
}

/**
 * Returns the viewports in which the links are shown inline while the overlay
 * is shown in others.
 *
 * Returns an empty list for the default `mobile` behavior (`null`), and when
 * the overlay is shown in no viewport or in every viewport, since no
 * viewport-specific rules are needed in those cases. Only the `mobile`,
 * `tablet` and `desktop` keys are read, and a viewport shows the links inline
 * only when its value is strictly `false`.
 *
 * @param overlayViewports Viewport map from `getOverlayViewports()`.
 * @return Viewports where the links are inline, in CSS order.
 */
export function getInlineViewports(
	overlayViewports: Partial< OverlayViewportMap > | null
): OverlayViewport[] {
	if (
		overlayViewports === null ||
		! isOverlayResponsive( overlayViewports ) ||
		isOverlayAlwaysShown( overlayViewports )
	) {
		return [];
	}
	return OVERLAY_VIEWPORTS.filter(
		( viewport ) => overlayViewports[ viewport ] === false
	);
}

/**
 * Returns the device preview to edit the overlay template part at, so that it
 * opens at a width where the overlay is shown.
 *
 * Only the `mobile`, `tablet` and `desktop` keys are read, and a viewport shows
 * the overlay only when its value is strictly `true`.
 *
 * @param overlayViewports          Viewport map from `getOverlayViewports()`.
 * @param options                   Options.
 * @param options.hasTabletViewport Whether the theme has a tablet breakpoint.
 *                                  Without one, the Tablet preview opens at
 *                                  desktop width.
 * @return Device preview, or `undefined` to open at the default Desktop width.
 */
export function getOverlayEditingViewport(
	overlayViewports: Partial< OverlayViewportMap > | null,
	{ hasTabletViewport }: { hasTabletViewport: boolean }
): 'tablet' | 'mobile' | undefined {
	// The default `mobile` behavior collapses below a fixed 600px.
	if ( overlayViewports === null ) {
		return 'mobile';
	}
	if ( overlayViewports.desktop === true ) {
		return undefined;
	}
	if ( overlayViewports.tablet === true && hasTabletViewport ) {
		return 'tablet';
	}
	if ( overlayViewports.mobile === true ) {
		return 'mobile';
	}
	return undefined;
}
