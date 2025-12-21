/**
 * Breakpoints
 *
 * This is the source file for device-related viewport breakpoint values.
 * All values are in pixels.
 *
 * While this file can be edited, changes should only be made with design input
 * to maintain consistency across the application.
 *
 * See BREAKPOINTS.md for usage documentation and historical context.
 */

const BREAKPOINTS = {
	'zoomed-in': 280,
	mobile: 480,
	small: 600,
	medium: 782,
	large: 960,
	xlarge: 1080,
	wide: 1280,
	huge: 1440,
	xhuge: 1920,
} as const;

export default BREAKPOINTS;
