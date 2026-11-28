export interface SitePartBlock {
	name: string;
	clientId?: string;
	attributes: Record< string, any >;
	innerBlocks: SitePartBlock[];
}

export interface SitePartContents {
	hasSiteTitle: boolean;
	hasSiteTagline: boolean;
	hasSiteLogo: boolean;
	/**
	 * The part's Navigation blocks, in document order. Each is a menu slot
	 * the Menu panel offers.
	 */
	navigations: SitePartBlock[];
	/** The part's first Social Icons block, if it has one. */
	socialLinks: SitePartBlock | null;
}

/**
 * Finds the first block with the given name, depth first.
 *
 * @param blocks The blocks to search.
 * @param name   The block name.
 * @return The block, or `null`.
 */
export function findBlock(
	blocks: SitePartBlock[] | undefined,
	name: string
): SitePartBlock | null {
	for ( const block of blocks ?? [] ) {
		if ( block.name === name ) {
			return block;
		}
		const found = findBlock( block.innerBlocks, name );
		if ( found ) {
			return found;
		}
	}
	return null;
}

/**
 * Finds every block with the given name, depth first. A matching block's
 * inner blocks aren't searched.
 *
 * @param blocks The blocks to search.
 * @param name   The block name.
 * @return The blocks, in document order.
 */
export function findBlocks(
	blocks: SitePartBlock[] | undefined,
	name: string
): SitePartBlock[] {
	return ( blocks ?? [] ).flatMap( ( block ) =>
		block.name === name ? [ block ] : findBlocks( block.innerBlocks, name )
	);
}

/**
 * What a site part holds that the Site parts screens offer controls for.
 *
 * @param blocks The part's blocks.
 * @return The part's contents.
 */
export function getSitePartContents(
	blocks: SitePartBlock[] | undefined
): SitePartContents {
	return {
		hasSiteTitle: !! findBlock( blocks, 'core/site-title' ),
		hasSiteTagline: !! findBlock( blocks, 'core/site-tagline' ),
		hasSiteLogo: !! findBlock( blocks, 'core/site-logo' ),
		navigations: findBlocks( blocks, 'core/navigation' ),
		socialLinks: findBlock( blocks, 'core/social-links' ),
	};
}

/**
 * Returns a copy of the blocks with one block, found by name and position,
 * replaced. Blocks are counted as `findBlocks` lists them.
 *
 * @param blocks  The blocks.
 * @param name    The name of the block to replace.
 * @param index   Which of the blocks with the name to replace.
 * @param replace Returns the replacement for the block.
 * @return The new blocks, or the same blocks when there is no such block.
 */
export function replaceBlock(
	blocks: SitePartBlock[],
	name: string,
	index: number,
	replace: ( block: SitePartBlock ) => SitePartBlock
): SitePartBlock[] {
	let count = 0;
	const visit = ( list: SitePartBlock[] ): SitePartBlock[] => {
		let changed = false;
		const next = list.map( ( block ) => {
			if ( count > index ) {
				return block;
			}
			if ( block.name === name ) {
				if ( count++ !== index ) {
					return block;
				}
				changed = true;
				return replace( block );
			}
			if ( ! block.innerBlocks?.length ) {
				return block;
			}
			const innerBlocks = visit( block.innerBlocks );
			if ( innerBlocks === block.innerBlocks ) {
				return block;
			}
			changed = true;
			return { ...block, innerBlocks };
		} );
		return changed ? next : list;
	};
	return visit( blocks );
}

/**
 * Returns a copy of the blocks with the first block with the given name
 * replaced, matching `findBlock`.
 *
 * @param blocks  The blocks.
 * @param name    The name of the block to replace.
 * @param replace Returns the replacement for the block.
 * @return The new blocks, or the same blocks when none has the name.
 */
export function replaceFirstBlock(
	blocks: SitePartBlock[],
	name: string,
	replace: ( block: SitePartBlock ) => SitePartBlock
): SitePartBlock[] {
	return replaceBlock( blocks, name, 0, replace );
}
