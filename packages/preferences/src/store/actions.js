/**
 * Returns an action object used in signalling that a feature should be toggled.
 *
 * @param {string} scope       The feature scope (e.g. core/edit-post).
 * @param {string} featureName The feature name.
 */
export function toggleFeature( scope, featureName ) {
	return function ( { select, dispatch } ) {
		const currentValue = select.isFeatureActive( scope, featureName );
		dispatch.setFeatureValue( scope, featureName, ! currentValue );
	};
}

/**
 * Returns an action object used in signalling that a feature should be set to
 * a true or false value
 *
 * @param {string}  scope       The feature scope (e.g. core/edit-post).
 * @param {string}  featureName The feature name.
 * @param {boolean} value       The value to set.
 *
 * @return {Object} Action object.
 */
export function setFeatureValue( scope, featureName, value ) {
	return {
		type: 'SET_FEATURE_VALUE',
		scope,
		featureName,
		value: !! value,
	};
}

/**
 * Returns an action object used in signalling that defaults should be set for features.
 *
 * @param {string}                  scope    The feature scope (e.g. core/edit-post).
 * @param {Object<string, boolean>} defaults A key/value map of feature names to values.
 *
 * @return {Object} Action object.
 */
export function setFeatureDefaults( scope, defaults ) {
	return {
		type: 'SET_FEATURE_DEFAULTS',
		scope,
		defaults,
	};
}
