/**
 * Normalizes an inserter block types list and includes variations as separate items.
 *
 * @param {Array} items Denormalized inserter items
 * @return {Array} Normalized inserter items.
 */
export function includeVariationsInInserterItems( items ) {
	return items.reduce( ( result, item ) => {
		const { variations = [] } = item;
		const hasDefaultVariation = variations.some(
			( { isDefault } ) => isDefault
		);

		// If there is no default inserter variation provided,
		// then default block type is displayed.
		if ( ! hasDefaultVariation ) {
			result.push( item );
		}

		if ( variations.length ) {
			result = result.concat(
				variations.map( ( variation ) => {
					return {
						...item,
						id: `${ item.id }-${ variation.name }`,
						icon: variation.icon || item.icon,
						title: variation.title || item.title,
						description: variation.description || item.description,
						// If `example` is explicitly undefined for the variation, the preview will not be shown.
						example: variation.hasOwnProperty( 'example' )
							? variation.example
							: item.example,
						initialAttributes: {
							...item.initialAttributes,
							...variation.attributes,
						},
						innerBlocks: variation.innerBlocks,
					};
				} )
			);
		}

		return result;
	}, [] );
}
