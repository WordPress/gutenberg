// TODO jsdoc + tests
const getVariationMapper = ( item ) => ( variation ) => ( {
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
} );

/**
 * Normalizes an inserter block types list and includes variations as separate items.
 *
 * @param {Array} items Denormalized inserter items
 * @param {number} [limit] Limit returned results by a given threshold. If limit===-1 return all
 * @return {Array} Normalized inserter items.
 */
export function includeVariationsInInserterItems( items, limit = -1 ) {
	const itemsLength = items.length;
	if ( limit > 0 && itemsLength >= limit ) {
		// No need to iterate for variations
		return items.slice( 0, limit );
	}
	if ( limit < 1 ) {
		// Show all available blocks with variations
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
				const variationMapper = getVariationMapper( item );
				result = result.concat( variations.map( variationMapper ) );
			}

			return result;
		}, [] );
	}

	// Limit is bigger than items length so we can add variations if exist
	let itemsToAdd = limit - itemsLength;
	let variationsToAdd = [];
	for ( const item of items ) {
		const { variations = [] } = item;
		const variationsLength = variations.length;
		if ( variationsLength ) {
			const variationMapper = getVariationMapper( item );
			variationsToAdd = variationsToAdd.concat(
				variations.slice( 0, itemsToAdd ).map( variationMapper )
			);
			itemsToAdd -= variationsLength;
			if ( itemsToAdd < 1 ) break;
		}
	}
	return items.concat( variationsToAdd );
}
