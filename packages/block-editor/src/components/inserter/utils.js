/**
 * Return a function to be used to tranform a block variation to an inserter item
 *
 * @param {Object} item Denormalized inserter item
 * @return {Function} Function to transform a block variation to inserter item
 */
const getItemFromVariation = ( item ) => ( variation ) => ( {
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
 * @param {number} [limit=Infinity] Limit returned results by a given threshold.
 * @return {Array} Normalized inserter items.
 */
export function includeVariationsInInserterItems( items, limit = Infinity ) {
	const itemsLength = items.length;
	if ( itemsLength >= limit ) {
		// No need to iterate for variations
		return items.slice( 0, limit );
	}

	// If there is a limit set but the items are fewer than the limit,
	// add the variations to fill the limit with order of blocks.
	// It should be handled better when decided how to choose the variations to fill.
	if ( Number.isFinite( limit ) ) {
		let itemsToAdd = limit - itemsLength;
		let variationsToAdd = [];
		for ( const item of items ) {
			const { variations = [] } = item;
			const variationsLength = variations.length;
			if ( variationsLength ) {
				const variationMapper = getItemFromVariation( item );
				variationsToAdd = variationsToAdd.concat(
					variations.slice( 0, itemsToAdd ).map( variationMapper )
				);
				itemsToAdd -= variationsLength;
				if ( itemsToAdd < 1 ) break;
			}
		}
		return items.concat( variationsToAdd );
	}

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
			const variationMapper = getItemFromVariation( item );
			result.push( ...variations.map( variationMapper ) );
		}

		return result;
	}, [] );
}
