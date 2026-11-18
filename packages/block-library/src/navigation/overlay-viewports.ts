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
