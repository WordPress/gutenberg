/**
 * Device preview width constants.
 *
 * These values match the breakpoints in:
 * - packages/base-styles/_breakpoints.scss ($break-medium: 782px, $break-mobile: 480px)
 * - packages/compose/src/hooks/use-viewport-match/index.js (medium: 782, mobile: 480)
 * - packages/components/src/utils/breakpoint-values.js
 *
 * The minus-1 arithmetic ensures the preview triggers the correct media query
 * for useViewportMatch with '<' operator.
 */

export const DEVICE_PREVIEW_WIDTHS = {
	Desktop: null, // full width, no constraint
	Tablet: 781, // 782 - 1: triggers useViewportMatch( 'medium', '<' )
	Mobile: 479, // 480 - 1: triggers useViewportMatch( 'mobile', '<' )
	Custom: null, // manual resize, no constraint
};

export const DEVICE_PREVIEW_HEIGHTS = {
	Desktop: null,
	Tablet: 1024,
	Mobile: 768,
	Custom: null,
};
