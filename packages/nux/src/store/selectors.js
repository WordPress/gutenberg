/**
 * An object containing information about a guide.
 *
 * @typedef {Object} NUXGuideInfo
 * @property {string[]} tipIds       Which tips the guide contains.
 * @property {?string}  currentTipId The guide's currently showing tip.
 * @property {?string}  nextTipId    The guide's next tip to show.
 */

/**
 * Returns null because the deprecated NUX package no longer displays guides.
 *
 * @return {null} No associated guide.
 */
export function getAssociatedGuide() {
	return null;
}

/**
 * Returns false because the deprecated NUX package no longer displays tips.
 *
 * @return {boolean} Whether or not the given tip is showing.
 */
export function isTipVisible() {
	return false;
}

/**
 * Returns false because the deprecated NUX package no longer displays tips.
 *
 * @return {boolean} Whether tips are globally enabled.
 */
export function areTipsEnabled() {
	return false;
}
