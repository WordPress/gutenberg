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
	// Exclude any block type item that is to be replaced by a default
	// variation.
	const filteredItems = items.filter(
		( { variations = [] } ) =>
			! variations.some( ( { isDefault } ) => isDefault )
	);

	// Fill `variationsToAdd` until there are as many items in total as
	// `limit`.
	const variationsToAdd = [];
	if ( filteredItems.length < limit ) {
		// Show all available blocks with variations
		for ( const item of items ) {
			if ( filteredItems.length + variationsToAdd.length >= limit ) {
				break;
			}

			const { variations = [] } = item;
			if ( variations.length ) {
				const variationMapper = getItemFromVariation( item );
				variationsToAdd.push( ...variations.map( variationMapper ) );
			}
		}
	}

	return [ ...filteredItems, ...variationsToAdd ].slice( 0, limit );
}
