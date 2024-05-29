/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { useRegistry } from '@wordpress/data';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { useEffect } from '@wordpress/element';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { store as blockEditorStore } from '@wordpress/block-editor';

function getLatestHeadings( select, clientId ) {
	const {
		getBlockAttributes,
		getBlockName,
		getClientIdsWithDescendants,
		getBlocksByName,
	} = select( blockEditorStore );

	// FIXME: @wordpress/block-library should not depend on @wordpress/editor.
	// Blocks can be loaded into a *non-post* block editor, so to avoid
	// declaring @wordpress/editor as a dependency, we must access its
	// store by string. When the store is not available, editorSelectors
	// will be null, and the block's saved markup will lack permalinks.
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const permalink = select( 'core/editor' ).getPermalink() ?? null;

	const isPaginated = getBlocksByName( 'core/nextpage' ).length !== 0;
	const { onlyIncludeCurrentPage } = getBlockAttributes( clientId ) ?? {};

	// Get the client ids of all blocks in the editor.
	const allBlockClientIds = getClientIdsWithDescendants();

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
	let headingPageLink = null;

	// If the core/editor store is available, we can add permalinks to the
	// generated table of contents.
	if ( typeof permalink === 'string' ) {
		headingPageLink = isPaginated
			? addQueryArgs( permalink, { page: headingPage } )
			: permalink;
	}

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

			if ( typeof permalink === 'string' ) {
				headingPageLink = addQueryArgs(
					removeQueryArgs( permalink, [ 'page' ] ),
					{ page: headingPage }
				);
			}
		}
		// If we're including all headings or we've reached headings on
		// the same page as the Table of Contents block, add them to the
		// list.
		else if ( ! onlyIncludeCurrentPage || headingPage === tocPage ) {
			if ( blockName === 'core/heading' ) {
				const headingAttributes = getBlockAttributes( blockClientId );

				const canBeLinked =
					typeof headingPageLink === 'string' &&
					typeof headingAttributes.anchor === 'string' &&
					headingAttributes.anchor !== '';

				latestHeadings.push( {
					// Convert line breaks to spaces, and get rid of HTML tags in the headings.
					content: stripHTML(
						headingAttributes.content.replace(
							/(<br *\/?>)+/g,
							' '
						)
					),
					level: headingAttributes.level,
					link: canBeLinked
						? `${ headingPageLink }#${ headingAttributes.anchor }`
						: null,
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
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( clientId, { headings } );
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
