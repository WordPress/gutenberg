/**
 * Returns a no-op action object. This package is deprecated and no longer
 * displays tips, but the action remains for backward compatibility.
 *
 * @param {string[]} tipIds Which tips would have been shown in the guide.
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
 * Returns a no-op action object. This package is deprecated and no longer
 * displays tips, but the action remains for backward compatibility.
 *
 * @param {string} id The tip that would have been dismissed.
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
 * Returns a no-op action object. This package is deprecated and no longer
 * displays tips, but the action remains for backward compatibility.
 *
 * @return {Object} Action object.
 */
export function disableTips() {
	return {
		type: 'DISABLE_TIPS',
	};
}

/**
 * Returns a no-op action object. This package is deprecated and no longer
 * displays tips, but the action remains for backward compatibility.
 *
 * @return {Object} Action object.
 */
export function enableTips() {
	return {
		type: 'ENABLE_TIPS',
	};
}
