
/**
 * Get the value of a feature flag by its name.
 *
 * Note, when this function is exported from `@wordpress/editor-configurations,
 * it is pre-bound and only requires the `featureName` argument.
 *
 * @param {Object} config      The configuration object.
 * @param {string} featureName The name of the feature.
 *
 * @return {boolean} Whether the feature is enabled (`true`) or disabled (`false`).
 */
export function getFeatureFlag( config, featureName ) {
	return !! config.features[ featureName ];
}
