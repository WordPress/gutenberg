/**
 * Viewports, in the order used for generated CSS.
 */
export const OVERLAY_VIEWPORTS = [ 'mobile', 'tablet', 'desktop' ] as const;

export type OverlayViewport = ( typeof OVERLAY_VIEWPORTS )[ number ];

/**
 * Whether the Navigation overlay is shown in each viewport.
 */
export type OverlayViewports = Record< OverlayViewport, boolean >;

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
	attributes: { overlayMenu?: unknown } = {}
): OverlayViewports | null {
	switch ( attributes.overlayMenu ) {
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
 * The default `mobile` behavior (`null`) is responsive.
 *
 * @param overlayViewports Viewport map from `getOverlayViewports()`.
 * @return Whether the overlay is shown in at least one viewport.
 */
export function isOverlayResponsive(
	overlayViewports: OverlayViewports | null
): boolean {
	return (
		overlayViewports === null ||
		OVERLAY_VIEWPORTS.some( ( viewport ) => overlayViewports[ viewport ] )
	);
}

/**
 * Returns whether the overlay is shown in every viewport.
 *
 * @param overlayViewports Viewport map from `getOverlayViewports()`.
 * @return Whether the overlay is shown in every viewport.
 */
export function isOverlayAlwaysShown(
	overlayViewports: OverlayViewports | null
): boolean {
	return (
		overlayViewports !== null &&
		OVERLAY_VIEWPORTS.every( ( viewport ) => overlayViewports[ viewport ] )
	);
}

/**
 * Returns the viewports in which the links are shown inline while the overlay
 * is shown in others.
 *
 * Returns an empty list for the default `mobile` behavior (`null`), and when
 * the overlay is shown in no viewport or in every viewport, since no
 * viewport-specific rules are needed in those cases.
 *
 * @param overlayViewports Viewport map from `getOverlayViewports()`.
 * @return Viewports where the links are inline, in CSS order.
 */
export function getInlineViewports(
	overlayViewports: OverlayViewports | null
): OverlayViewport[] {
	if (
		overlayViewports === null ||
		! isOverlayResponsive( overlayViewports ) ||
		isOverlayAlwaysShown( overlayViewports )
	) {
		return [];
	}
	return OVERLAY_VIEWPORTS.filter(
		( viewport ) => ! overlayViewports[ viewport ]
	);
}
