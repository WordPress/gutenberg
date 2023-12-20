/**
 * Helper to update the bindings attribute used by the Block Bindings API.
 *
 * @param {Object}   blockAttributes  - The original block attributes.
 * @param {Function} setAttributes    - setAttributes function to modify the bindings property.
 * @param {string}   attributeName    - The attribute in the bindings object to update.
 * @param {string}   sourceName       - The source name added to the bindings property.
 * @param {string}   sourceAttributes - The source attributes added to the bindings property.
 */
export const updateBlockBindingsAttribute = (
	blockAttributes,
	setAttributes,
	attributeName,
	sourceName,
	sourceAttributes
) => {
	// TODO: Review if we can create a React Hook for this.

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

	let updatedBindings = {};
	// // If no sourceName is provided, remove the attribute from the bindings.
	if ( sourceName === null ) {
		if ( ! blockAttributes?.metadata.bindings ) {
			return blockAttributes?.metadata;
		}

		updatedBindings = {
			...blockAttributes?.metadata?.bindings,
			[ attributeName ]: undefined,
		};
		if ( Object.keys( updatedBindings ).length === 1 ) {
			updatedBindings = undefined;
		}
	} else {
		updatedBindings = {
			...blockAttributes?.metadata?.bindings,
			[ attributeName ]: {
				source: { name: sourceName, attributes: sourceAttributes },
			},
		};
	}

	setAttributes( {
		metadata: {
			...blockAttributes.metadata,
			bindings: updatedBindings,
		},
	} );

	return blockAttributes.metadata;
};
