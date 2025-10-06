/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * WordPress dependencies
 */
import { useRegistry } from '@wordpress/data';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

function getLatestHeadings( select, clientId ) {
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

				// Use explicit anchor or generate one from content
				let anchor =
					typeof headingAttributes.anchor === 'string' &&
					headingAttributes.anchor !== ''
						? headingAttributes.anchor
						: null;

				// Auto-generate anchor from content if not set
				if ( ! anchor && content ) {
					anchor = content
						.toLowerCase()
						.replace( /[^\w\s-]/g, '' )
						.replace( /[\s_]+/g, '-' )
						.replace( /^-+|-+$/g, '' );
				}

				latestHeadings.push( {
					content,
					level: headingAttributes.level,
					// Store only the anchor (with # prefix), not full URL
					// Full URL will be added server-side
					link: anchor ? `#${ anchor }` : '',
					page: isPaginated && headingPage > 1 ? headingPage : null,
				} );
			}
		}
	}

	return latestHeadings;
}

function observeCallback( select, dispatch, clientId ) {
	const { getBlockAttributes } = select( blockEditorStore );
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		dispatch( blockEditorStore );

	/**
	 * If the block no longer exists in the store, skip the update.
	 * The "undo" action recreates the block and provides a new `clientId`.
	 * The hook still might be observing the changes while the old block unmounts.
	 */
	const attributes = getBlockAttributes( clientId );
	if ( attributes === null ) {
		return;
	}

	const headings = getLatestHeadings( select, clientId );
	if ( ! fastDeepEqual( headings, attributes.headings ) ) {
		// Executing the update in a microtask ensures that the non-persistent marker doesn't affect an attribute triggering the change.
		window.queueMicrotask( () => {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( clientId, { headings } );
		} );
	}
}

export function useObserveHeadings( clientId ) {
	const registry = useRegistry();
	useEffect( () => {
		// Todo: Limit subscription to block editor store when data no longer depends on `getPermalink`.
		// See: https://github.com/WordPress/gutenberg/pull/45513
		return registry.subscribe( () =>
			observeCallback( registry.select, registry.dispatch, clientId )
		);
	}, [ registry, clientId ] );
}
