/**
 * Block visibility breakpoint constants and type definitions.
 *
 * @module block-visibility-breakpoints/constants
 */

/**
 * Breakpoint names for responsive visibility control.
 *
 * @typedef {'mobile'|'tablet'|'desktop'} BreakpointName
 */

/**
 * Breakpoint name constants to avoid magic strings.
 *
 * @type {Object}
 * @property {string} MOBILE  - Mobile breakpoint (< 600px)
 * @property {string} TABLET  - Tablet breakpoint (600px - 960px)
 * @property {string} DESKTOP - Desktop breakpoint (>= 960px)
 */
export const BREAKPOINT_NAMES = {
	MOBILE: 'mobile',
	TABLET: 'tablet',
	DESKTOP: 'desktop',
};

/**
 * Array of all breakpoint names for iteration.
 *
 * @type {BreakpointName[]}
 */
export const ALL_BREAKPOINTS = [
	BREAKPOINT_NAMES.MOBILE,
	BREAKPOINT_NAMES.TABLET,
	BREAKPOINT_NAMES.DESKTOP,
];

/**
 * Block visibility breakpoints configuration.
 *
 * @typedef {Object} BlockVisibilityBreakpoints
 * @property {boolean} mobile  - Whether to hide the block on mobile viewports (< 600px)
 * @property {boolean} tablet  - Whether to hide the block on tablet viewports (600px - 960px)
 * @property {boolean} desktop - Whether to hide the block on desktop viewports (>= 960px)
 */

/**
 * Creates a default breakpoints object with all values set to false.
 *
 * @return {BlockVisibilityBreakpoints} Default breakpoints configuration
 */
export function createDefaultBreakpoints() {
	return {
		mobile: false,
		tablet: false,
		desktop: false,
	};
}

/**
 * Checks if any breakpoint visibility is set.
 *
 * @param {BlockVisibilityBreakpoints|null|undefined} breakpoints - Breakpoints configuration
 * @return {boolean} True if any breakpoint has visibility set
 */
export function hasAnyBreakpointVisibility( breakpoints ) {
	return (
		breakpoints &&
		( breakpoints.mobile || breakpoints.tablet || breakpoints.desktop )
	);
}

/**
 * Checks if all breakpoints are set (equivalent to "hide everywhere").
 *
 * @param {BlockVisibilityBreakpoints|null|undefined} breakpoints - Breakpoints configuration
 * @return {boolean} True if all breakpoints are set to hide
 */
export function isHiddenOnAllBreakpoints( breakpoints ) {
	return (
		breakpoints &&
		breakpoints.mobile &&
		breakpoints.tablet &&
		breakpoints.desktop
	);
}
