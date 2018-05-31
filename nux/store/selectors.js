/**
 * External dependencies
 */
import { includes, difference, keys } from 'lodash';

/**
 * Returns an object describing the guide, if any, that the given tip is a part
 * of.
 *
 * @param {Object} state Global application state.
 * @param {string} tipID The tip to query.
 *
 * @typedef {Object} NUX.GuideInfo
 * @property {string[]} tipIDs       Which tips the guide contains.
 * @property {?string}  currentTipID The guide's currently showing tip.
 * @property {?string}  nextTipID    The guide's next tip to show.
 *
 * @return {?NUX.GuideInfo} Information about the associated guide.
 */
export function getAssociatedGuide( state, tipID ) {
	for ( const tipIDs of state.guides ) {
		if ( includes( tipIDs, tipID ) ) {
			const nonDismissedTips = difference( tipIDs, keys( state.preferences.dismissedTips ) );
			const [ currentTipID = null, nextTipID = null ] = nonDismissedTips;
			return { tipIDs, currentTipID, nextTipID };
		}
	}

	return null;
}

/**
 * Determines whether or not the given tip is showing. Tips are hidden if they
 * are disabled, have been dismissed, or are not the current tip in any
 * guide that they have been added to.
 *
 * @param {Object} state Global application state.
 * @param {string} id    The tip to query.
 *
 * @return {boolean} Whether or not the given tip is showing.
 */
export function isTipVisible( state, id ) {
	if ( state.preferences.areTipsDisabled ) {
		return false;
	}

	if ( state.preferences.dismissedTips[ id ] ) {
		return false;
	}

	const associatedGuide = getAssociatedGuide( state, id );
	if ( associatedGuide && associatedGuide.currentTipID !== id ) {
		return false;
	}

	return true;
}
