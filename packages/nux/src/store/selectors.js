/**
 * External dependencies
 */
import createSelector from 'rememo';
import { includes, difference, keys } from 'lodash';

/**
 * An object containing information about a guide.
 *
 * @typedef {Object} NUX.GuideInfo
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
 * @return {?NUX.GuideInfo} Information about the associated guide.
 */
export const getAssociatedGuide = createSelector(
	( state, tipId ) => {
		for ( const tipIds of state.guides ) {
			if ( includes( tipIds, tipId ) ) {
				const nonDismissedTips = difference( tipIds, keys( state.preferences.dismissedTips ) );
				const [ currentTipId = null, nextTipId = null ] = nonDismissedTips;
				return { tipIds, currentTipId, nextTipId };
			}
		}

		return null;
	},
	( state ) => [
		state.guides,
		state.preferences.dismissedTips,
	],
);

/**
 * Determines whether the given tip or DotTip instance should be visible. Checks:
 *
 * - That all tips are enabled.
 * - That the given tip has not been dismissed.
 * - If the given tip is part of a guide, that the given tip is the current tip in the guide.
 * - If instanceId is provided, that this is the first DotTip instance for the given tip.
 *
 * @param {Object}  state      Global application state.
 * @param {string}  tipId      The tip to query.
 * @param {?number} instanceId A number which uniquely identifies the DotTip instance.
 *
 * @return {boolean} Whether the given tip or Dottip instance should be shown.
 */
export function isTipVisible( state, tipId, instanceId ) {
	if ( ! state.preferences.areTipsEnabled ) {
		return false;
	}

	if ( state.preferences.dismissedTips[ tipId ] ) {
		return false;
	}

	const associatedGuide = getAssociatedGuide( state, tipId );
	if ( associatedGuide && associatedGuide.currentTipId !== tipId ) {
		return false;
	}

	if ( instanceId ) {
		const [ firstInstanceId ] = state.tipInstanceIds[ tipId ] || [];
		if ( instanceId !== firstInstanceId ) {
			return false;
		}
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
