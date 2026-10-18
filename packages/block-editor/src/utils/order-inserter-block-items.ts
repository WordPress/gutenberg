type EditorInserterItem = { id: string };

/**
 * Helper function to order inserter block items according to a provided array of prioritized blocks.
 *
 * @param items    The array of editor inserter block items to be sorted.
 * @param priority The array of block names to be prioritized.
 * @return The sorted array of editor inserter block items.
 */
export const orderInserterBlockItems = (
	items: EditorInserterItem[],
	priority: string[] | undefined
) => {
	if ( ! priority ) {
		return items;
	}

	items.sort( ( { id: aName }, { id: bName } ) => {
		// Sort block items according to `priority`.
		let aIndex = priority.indexOf( aName );
		let bIndex = priority.indexOf( bName );
		// All other block items should come after that.
		if ( aIndex < 0 ) {
			aIndex = priority.length;
		}
		if ( bIndex < 0 ) {
			bIndex = priority.length;
		}
		return aIndex - bIndex;
	} );

	return items;
};
