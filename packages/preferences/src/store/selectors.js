/**
 * Returns a boolean indicating whether a feature is active for a particular
 * scope.
 *
 * @param {Object} state       The store state.
 * @param {string} scope       The scope of the feature (e.g. core/edit-post).
 * @param {string} featureName The name of the feature.
 *
 * @return {boolean} Is the feature enabled?
 */
export function isFeatureActive( state, scope, featureName ) {
	const featureValue = state.features[ scope ]?.[ featureName ];
	const defaultedFeatureValue =
		featureValue !== undefined
			? featureValue
			: state.featureDefaults[ scope ]?.[ featureName ];

	return !! defaultedFeatureValue;
}
