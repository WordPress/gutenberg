/**
 * Helper to update the bindings attribute used by the Block Bindings API.
 *
 * @param {Object}   blockAttributes   - The original block attributes.
 * @param {Function} setAttributes     - setAttributes function to modify the bindings property.
 * @param {string}   updatingAttribute - The attribute in the bindings object to update.
 * @param {string}   sourceName        - The source name added to the bindings property.
 * @param {string}   sourceParams      - The source params added to the bindings property.
 */
export const updateBlockBindingsAttribute = (
	blockAttributes,
	setAttributes,
	updatingAttribute,
	sourceName,
	sourceParams
) => {
	// TODO: Review the bindings syntax.
	// For now, I'm adding a new property to the "metadata" attribute with this syntax:
	// [
	// 	{
	// 	  "attribute": "url",
	// 	  "source": { "name": "metadata", "params": { "value": "custom_field_1" } }
	// 	},
	// 	{
	// 	  "attribute": "title",
	// 	  "source": { "name": "metadata", "params": { "value": "custom_field_2" } }
	// 	}
	// ]

	// Only modify the bindings property of the metadata attribute
	const metadataAttribute = blockAttributes.metadata
		? blockAttributes.metadata
		: {};

	// If no sourceName is provided, remove the attribute from the bindings.
	if ( sourceName === null ) {
		if ( ! metadataAttribute.bindings ) {
			return metadataAttribute;
		}
		const bindingsArray = metadataAttribute.bindings.filter(
			( item ) => item.attribute !== updatingAttribute
		);
		if ( bindingsArray.length > 0 ) {
			metadataAttribute.bindings = bindingsArray;
		} else {
			delete metadataAttribute.bindings;
		}
		setAttributes( {
			metadata: metadataAttribute,
		} );
		return metadataAttribute;
	}

	const bindingsArray = metadataAttribute.bindings
		? metadataAttribute.bindings
		: [];

	// If the attribute exists in the bindings, update it.
	// Otherwise, add it.
	let attributeExists = false;
	bindingsArray.forEach( ( binding ) => {
		if ( binding.attribute === updatingAttribute ) {
			binding.source.name = sourceName;
			binding.source.params = sourceParams;
			attributeExists = true;
		}
	} );

	if ( ! attributeExists ) {
		bindingsArray.push( {
			attribute: updatingAttribute,
			source: {
				name: sourceName,
				params: sourceParams,
			},
		} );
	}

	metadataAttribute.bindings = bindingsArray;
	// TODO: Decide if we want to include the setAttributes call here.
	setAttributes( {
		metadata: metadataAttribute,
	} );

	// TODO: Not sure if we need to return the updated attributes.
	return metadataAttribute;
};
