/**
 * Transform the metadata attribute with only the values and bindings specified by each transform.
 * Returns `undefined` if the input metadata is falsy.
 *
 * @param {Object} metadata         Original metadata attribute from the block that is being transformed.
 * @param {Array}  supportedProps   Array with the metadata properties to keep after the transform.
 * @param {Object} bindingsMappings Maps each bound attribute of the original block to its corresponding attribute in the result.
 * @return {Object|undefined} New metadata object only with the relevant properties.
 */
export function getTransformedMetadata(
	metadata,
	supportedProps,
	bindingsMappings
) {
	if ( ! metadata ) {
		return;
	}
	return Object.entries( metadata ).reduce( ( obj, [ prop, value ] ) => {
		// If prop is not supported, don't add it to the new metadata object.
		if ( ! supportedProps.includes( prop ) ) {
			return obj;
		}
		// If prop is `bindings` and `bindingsMappings` is not defined, don't add it to the new metadata object.
		if ( prop === 'bindings' && ! bindingsMappings ) {
			return obj;
		}
		// Adapt bindings object if `bindingsMappings` is defined.
		// The rest of properties are added as they are.
		obj[ prop ] =
			prop === 'bindings' && !! bindingsMappings
				? Object.entries( bindingsMappings ).reduce(
						( bindingsObj, [ originalKey, resultingKey ] ) => {
							bindingsObj[ resultingKey ] = value[ originalKey ];
							return bindingsObj;
						},
						{}
				  )
				: value;

		return obj;
	}, {} );
}
