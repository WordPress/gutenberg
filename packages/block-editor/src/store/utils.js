/**
 * Helper function that maps attribute definition properties to the
 * ones used by RichText utils like `create, toHTMLString, etc..`.
 *
 * @param {Object} attributeDefinition A block's attribute definition object.
 * @return {Object} The mapped object.
 */
export function mapRichTextSettings( attributeDefinition ) {
	const {
		multiline: multilineTag,
		__unstableMultilineWrapperTags: multilineWrapperTags,
		__unstablePreserveWhiteSpace: preserveWhiteSpace,
	} = attributeDefinition;
	return {
		multilineTag,
		multilineWrapperTags,
		preserveWhiteSpace,
	};
}

export function getBlocksRelationshipsMap( blockTypes ) {
	return blockTypes.reduce( ( accumulator, blockType ) => {
		if ( ! blockType.parent && ! blockType.ancestor ) {
			return accumulator;
		}
		const parentsAndAncestors = [
			...( blockType.parent || [] ),
			...( blockType.ancestor || [] ),
		];
		// Create a map of current block's parent/ancestor relationship.
		parentsAndAncestors.forEach( ( ancestor ) => {
			if ( accumulator[ ancestor ] ) {
				accumulator[ ancestor ].add( blockType.name );
			} else {
				accumulator[ ancestor ] = new Set( [ blockType.name ] );
			}
		} );
		return accumulator;
	}, {} );
}

export function getAvailableNestedBlocks( allBlockTypes, allowedBlockNames ) {
	const blocksRelationships = getBlocksRelationshipsMap( allBlockTypes );
	function getFlatRelationship( item, list = [] ) {
		const nodes = blocksRelationships[ item ];
		if ( ! nodes ) {
			return list;
		}
		for ( const node of nodes ) {
			list.push( node );
			getFlatRelationship( node, list );
		}
		return list;
	}
	const availableNestedBlocks = allowedBlockNames.reduce(
		( accumulator, blockName ) => {
			const list = getFlatRelationship( blockName );
			if ( list.length ) {
				list.forEach( ( name ) => accumulator.add( name ) );
			}
			return accumulator;
		},
		new Set()
	);
	return Array.from( availableNestedBlocks );
}
