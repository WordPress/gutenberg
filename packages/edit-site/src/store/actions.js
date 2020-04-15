/**
 * Returns an action object used to toggle a feature flag.
 *
 * @param {string} feature Feature name.
 *
 * @return {Object} Action object.
 */
export function toggleFeature( feature ) {
	return {
		type: 'TOGGLE_FEATURE',
		feature,
	};
}

/**
 * Returns an action object used to toggle the width of the editing canvas.
 *
 * @param {string} deviceType
 *
 * @return {Object} Action object.
 */
export function __experimentalSetPreviewDeviceType( deviceType ) {
	return {
		type: 'SET_PREVIEW_DEVICE_TYPE',
		deviceType,
	};
}

/** Returns an action object signaling the save panel to be open.
 *
 * @param {Function} onRequestClose Callback to use when closing the panel.
 *
 * @return {Object} Action object.
 */
export function openEntitiesSavedStates( onRequestClose ) {
	return {
		type: 'OPEN_ENTITIES_SAVED_STATES',
		onRequestClose,
	};
}

/**
 * Returns an action object signaling to close the save panel and invoke callback.
 *
 * @param {*} callbackArg Argument to be used in close callback function.
 */
export function closeEntitiesSavedStates( callbackArg ) {
	return {
		type: 'CLOSE_ENTITIES_SAVED_STATES',
		callbackArg,
	};
}
