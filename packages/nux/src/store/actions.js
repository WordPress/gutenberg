/**
 * Returns an action object that, when dispatched, presents a guide that takes
 * the user through a series of tips step by step.
 *
 * @param {string[]} tipIds Which tips to show in the guide.
 *
 * @return {Object} Action object.
 */
export function triggerGuide( tipIds ) {
	return {
		type: 'TRIGGER_GUIDE',
		tipIds,
	};
}

/**
 * Returns an action object that, when dispathed, associates an instance of the
 * DotTip component with a tip. This is usually done when the component mounts.
 * Tracking this lets us only show one DotTip at a time per tip.
 *
 * @param {string} tipId      The tip to associate this instance with.
 * @param {number} instanceId A number which uniquely identifies the instance.
 *
 * @return {Object} Action object.
 */
export function registerTipInstance( tipId, instanceId ) {
	return {
		type: 'REGISTER_TIP_INSTANCE',
		tipId,
		instanceId,
	};
}

/**
 * Returns an action object that, when dispatched, removes the association
 * between a DotTip component instance and a tip. This is usually done when the
 * component unmounts. Tracking this lets us only show one DotTip at a time per
 * tip.
 *
 * @param {string} tipId      The tip to disassociate this instance with.
 * @param {number} instanceId A number which uniquely identifies the instance.
 *
 * @return {Object} Action object.
 */
export function unregisterTipInstance( tipId, instanceId ) {
	return {
		type: 'UNREGISTER_TIP_INSTANCE',
		tipId,
		instanceId,
	};
}

/**
 * Returns an action object that, when dispatched, dismisses the given tip. A
 * dismissed tip will not show again.
 *
 * @param {string} id The tip to dismiss.
 *
 * @return {Object} Action object.
 */
export function dismissTip( id ) {
	return {
		type: 'DISMISS_TIP',
		id,
	};
}

/**
 * Returns an action object that, when dispatched, prevents all tips from
 * showing again.
 *
 * @return {Object} Action object.
 */
export function disableTips() {
	return {
		type: 'DISABLE_TIPS',
	};
}

/**
 * Returns an action object that, when dispatched, makes all tips show again.
 *
 * @return {Object} Action object.
 */
export function enableTips() {
	return {
		type: 'ENABLE_TIPS',
	};
}
