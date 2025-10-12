/**
 * WordPress dependencies
 */
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

// Cache for memoizing heading results.
const headingCache = new Map();

export function getLatestHeadings( select, clientId ) {
	const {
		getBlockAttributes,
		getBlockName,
		getBlocksByName,
		getClientIdsOfDescendants,
		getBlocks,
	} = select( blockEditorStore );

	const isPaginated = getBlocksByName( 'core/nextpage' ).length !== 0;
	const { onlyIncludeCurrentPage, maxLevel } =
		getBlockAttributes( clientId ) ?? {};

	const allBlocks = getBlocks();
	const nextPageBlocks = getBlocksByName( 'core/nextpage' );
	const postContentBlocks = getBlocksByName( 'core/post-content' );

	const headingBlocks = allBlocks.filter(
		( block ) => block.name === 'core/heading'
	);
	const headingData = headingBlocks.map( ( block ) => ( {
		clientId: block.clientId,
		content: block.attributes?.content || '',
		level: block.attributes?.level || 1,
		anchor: block.attributes?.anchor || '',
	} ) );

	const cacheKey = JSON.stringify( {
		clientId,
		onlyIncludeCurrentPage,
		maxLevel,
		isPaginated,
		blocksCount: allBlocks.length,
		nextPageCount: nextPageBlocks.length,
		postContentCount: postContentBlocks.length,
		headingData,
	} );

	// Check if we have a cached result for this data.
	if ( headingCache.has( cacheKey ) ) {
		return headingCache.get( cacheKey );
	}

	// Get post-content block client ID.
	const [ postContentClientId = '' ] = getBlocksByName( 'core/post-content' );

	// Get the client ids of all blocks in the editor.
	let allBlockClientIds;
	if ( postContentClientId ) {
		// Post context: search within post-content.
		allBlockClientIds = getClientIdsOfDescendants( postContentClientId );
	} else {
		// Template context: get all blocks from root.
		const rootBlocks = getBlocks();
		const flattenBlocks = ( blocks ) => {
			return blocks.flatMap( ( block ) => [
				block.clientId,
				...flattenBlocks( block.innerBlocks || [] ),
			] );
		};
		allBlockClientIds = flattenBlocks( rootBlocks );
	}

	// If onlyIncludeCurrentPage is true, calculate the page (of a paginated post) this block is part of, so we know which headings to include; otherwise, skip the calculation.
	let tocPage = 1;

	if ( isPaginated && onlyIncludeCurrentPage ) {
		// We can't use getBlockIndex because it only returns the index
		// relative to sibling blocks.
		const tocIndex = allBlockClientIds.indexOf( clientId );

		for ( const [
			blockIndex,
			blockClientId,
		] of allBlockClientIds.entries() ) {
			// If we've reached blocks after the Table of Contents, we've
			// finished calculating which page the block is on.
			if ( blockIndex >= tocIndex ) {
				break;
			}
			if ( getBlockName( blockClientId ) === 'core/nextpage' ) {
				tocPage++;
			}
		}
	}

	const latestHeadings = [];

	/** The page (of a paginated post) a heading will be part of. */
	let headingPage = 1;

	for ( const blockClientId of allBlockClientIds ) {
		const blockName = getBlockName( blockClientId );
		if ( blockName === 'core/nextpage' ) {
			headingPage++;

			// If we're only including headings from the current page (of
			// a paginated post), then exit the loop if we've reached the
			// pages after the one with the Table of Contents block.
			if ( onlyIncludeCurrentPage && headingPage > tocPage ) {
				break;
			}
		}
		// If we're including all headings or we've reached headings on
		// the same page as the Table of Contents block, add them to the
		// list.
		else if ( ! onlyIncludeCurrentPage || headingPage === tocPage ) {
			if ( blockName === 'core/heading' ) {
				const headingAttributes = getBlockAttributes( blockClientId );

				// Skip headings that are deeper than maxLevel
				if ( maxLevel && headingAttributes.level > maxLevel ) {
					continue;
				}

				// Get the heading content
				const content = stripHTML(
					headingAttributes.content.replace( /(<br *\/?>)+/g, ' ' )
				);

				// Use anchor from heading block attributes
				const anchor =
					typeof headingAttributes.anchor === 'string' &&
					headingAttributes.anchor !== ''
						? headingAttributes.anchor
						: null;

				// Use relative anchor links
				const fullLink = anchor ? `#${ anchor }` : '';

				latestHeadings.push( {
					content,
					level: headingAttributes.level,
					link: fullLink,
					page: isPaginated && headingPage > 1 ? headingPage : null,
				} );
			}
		}
	}

	// Cache the result and clean up old entries.
	headingCache.set( cacheKey, latestHeadings );

	// Keep only the most recent 50 entries to prevent memory leaks.
	if ( headingCache.size > 50 ) {
		const firstKey = headingCache.keys().next().value;
		headingCache.delete( firstKey );
	}

	return latestHeadings;
}

/**
 * Hook to get the latest headings.
 *
 * @param {string} clientId The block's client ID.
 * @return {Array} Array of heading objects with content, level, link, and page properties.
 */
export function useHeadings( clientId ) {
	return useSelect(
		( select ) => {
			return getLatestHeadings( select, clientId );
		},
		[ clientId ]
	);
}
