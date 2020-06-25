export const flattenBlocks = ( blocks ) =>
	blocks.flatMap( ( item ) =>
		[ item ].concat( flattenBlocks( item.innerBlocks || [] ) )
	);
