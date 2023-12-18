/**
 * Helper to update the bindings attribute used by the Block Bindings API.
 *
 * @param {Object}   blockAttributes   - The original block attributes.
 * @param {Function} setAttributes     - setAttributes function to modify the bindings property.
 * @param {string}   updatingAttribute - The attribute in the bindings object to update.
 * @param {string}   sourceName        - The source name added to the bindings property.
 * @param {string}   sourceAttributes  - The source attributes added to the bindings property.
 */
export const updateBlockBindingsAttribute = (
	blockAttributes,
	setAttributes,
	updatingAttribute,
	sourceName,
	sourceAttributes
) => {
	// TODO: Review the bindings syntax.
	// Assuming the following format for the bindings property of the "metadata" attribute:
	//
	// "bindings": {
	//   "title": {
	//       "source": {
	//         "name": "metadata",
	//         "attributes": { "value": "text_custom_field" }
	//       }
	//   },
	//   "url": {
	//       "source": {
	//         "name": "metadata",
	//         "attributes": { "value": "text_custom_field" }
	//       }
	//   }
	// },
	// .

	// Only modify the bindings property of the metadata attribute
	const metadataAttribute = blockAttributes.metadata
		? blockAttributes.metadata
		: {};

	// If no sourceName is provided, remove the attribute from the bindings.
	if ( sourceName === null ) {
		if ( ! metadataAttribute.bindings ) {
			return metadataAttribute;
		}
		delete metadataAttribute.bindings[ updatingAttribute ];
		// If bindings is empty, remove the bindings property.
		if ( Object.keys( metadataAttribute.bindings ).length === 0 ) {
			delete metadataAttribute.bindings;
		}
		setAttributes( {
			metadata: metadataAttribute,
		} );
		return metadataAttribute;
	}

	const bindingsProperty = metadataAttribute.bindings
		? metadataAttribute.bindings
		: {};

	bindingsProperty[ updatingAttribute ] = {
		source: { name: sourceName, attributes: sourceAttributes },
	};

	metadataAttribute.bindings = bindingsProperty;
	// TODO: Decide if we want to include the setAttributes call here.
	setAttributes( {
		metadata: metadataAttribute,
	} );

	// TODO: Not sure if we need to return the updated attributes.
	return metadataAttribute;
};
