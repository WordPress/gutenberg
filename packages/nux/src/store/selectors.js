/**
 * WordPress dependencies
 */
import { createSelector } from '@wordpress/data';

/**
 * An object containing information about a guide.
 *
 * @typedef {Object} NUXGuideInfo
 * @property {string[]} tipIds       Which tips the guide contains.
 * @property {?string}  currentTipId The guide's currently showing tip.
 * @property {?string}  nextTipId    The guide's next tip to show.
 */

/**
 * Returns an object describing the guide, if any, that the given tip is a part
 * of.
 *
 * @param {Object} state Global application state.
 * @param {string} tipId The tip to query.
 *
 * @return {?NUXGuideInfo} Information about the associated guide.
 */
export const getAssociatedGuide = createSelector(
	( state, tipId ) => {
		for ( const tipIds of state.guides ) {
			if ( tipIds.includes( tipId ) ) {
				const nonDismissedTips = tipIds.filter(
					( tId ) =>
						! Object.keys(
							state.preferences.dismissedTips
						).includes( tId )
				);
				const [ currentTipId = null, nextTipId = null ] =
					nonDismissedTips;
				return { tipIds, currentTipId, nextTipId };
			}
		}

		return null;
	},
	( state ) => [ state.guides, state.preferences.dismissedTips ]
);

/**
 * Determines whether or not the given tip is showing. Tips are hidden if they
 * are disabled, have been dismissed, or are not the current tip in any
 * guide that they have been added to.
 *
 * @param {Object} state Global application state.
 * @param {string} tipId The tip to query.
 *
 * @return {boolean} Whether or not the given tip is showing.
 */
export function isTipVisible( state, tipId ) {
	if ( ! state.preferences.areTipsEnabled ) {
		return false;
	}

	if ( state.preferences.dismissedTips?.hasOwnProperty( tipId ) ) {
		return false;
	}

	const associatedGuide = getAssociatedGuide( state, tipId );
	if ( associatedGuide && associatedGuide.currentTipId !== tipId ) {
		return false;
	}

	return true;
}

/**
 * Returns whether or not tips are globally enabled.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether tips are globally enabled.
 */
export function areTipsEnabled( state ) {
	return state.preferences.areTipsEnabled;
}
