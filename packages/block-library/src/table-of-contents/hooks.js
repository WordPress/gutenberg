/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

export const META_KEY = 'core_table_of_contents';

export function getHeadingsFromMeta( meta ) {
	if ( ! meta?.[ META_KEY ] ) {
		return [];
	}

	return JSON.parse( meta[ META_KEY ] );
}

function getLatestHeadings( select, clientId ) {
	const {
		getBlockAttributes,
		getBlockName,
		getClientIdsWithDescendants,
		__experimentalGetGlobalBlocksByName: getGlobalBlocksByName,
	} = select( blockEditorStore );

	const isPaginated = getGlobalBlocksByName( 'core/nextpage' ).length !== 0;
	const { onlyIncludeCurrentPage } = getBlockAttributes( clientId );

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

	// The page (of a paginated post) a heading will be part of.
	let headingPage = 1;

	const latestHeadings = [];
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

				const canBeLinked =
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
					link: canBeLinked ? `#${ headingAttributes.anchor }` : null,
					page: isPaginated ? headingPage : null,
				} );
			}
		}
	}

	return latestHeadings;
}

function observeCallback( select, dispatch, context ) {
	const { clientId, postType, postId } = context;
	const { getBlock } = select( blockEditorStore );

	/**
	 * If the block no longer exists in the store, skip the update.
	 * The "undo" action recreates the block and provides a new `clientId`.
	 * The hook still might be observing the changes while the old block unmounts.
	 */
	if ( getBlock( clientId ) === null ) {
		return;
	}

	const { getEditedEntityRecord } = select( coreStore );
	const { editEntityRecord } = dispatch( coreStore );

	const meta = getEditedEntityRecord( 'postType', postType, postId ).meta;
	const storedHeadings = getHeadingsFromMeta( meta );

	const headings = getLatestHeadings( select, clientId );
	if ( ! fastDeepEqual( headings, storedHeadings ) ) {
		editEntityRecord(
			'postType',
			postType,
			postId,
			{
				meta: {
					...meta,
					[ META_KEY ]: JSON.stringify( headings ),
				},
			},
			{
				undoIgnore: true,
			}
		);
	}
}

export function useObserveHeadings( { clientId, postType, postId } ) {
	const registry = useRegistry();
	useEffect( () => {
		return registry.subscribe(
			() =>
				observeCallback( registry.select, registry.dispatch, {
					clientId,
					postType,
					postId,
				} ),
			blockEditorStore
		);
	}, [ registry, clientId, postType, postId ] );
}
