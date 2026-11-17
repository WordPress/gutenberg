import { createBlock } from '@wordpress/blocks';
import type { BlockInstance } from '@wordpress/blocks';
import { useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { PAGE_LIST_ITEM } from './utils';

// The binding that keeps a page link's URL in step with the page, as
// `buildNavigationLinkEntityBinding( 'post-type' )` makes it.
const PAGE_LINK_BINDINGS = {
	url: { source: 'core/post-data', args: { field: 'link' } },
};

/**
 * Turns the blocks of a Page List into Navigation Link and Submenu blocks, as
 * they're shown: in their order and at their levels. A hidden page becomes a
 * hidden link, and any other item put among the pages stays where it is.
 *
 * @param blocks The Page List's inner blocks.
 *
 * @return Navigation Link and Submenu blocks.
 */
export function convertPageListBlocksToLinks(
	blocks: BlockInstance[] = []
): BlockInstance[] {
	return blocks.map( ( block ) => {
		if ( block.name !== PAGE_LIST_ITEM ) {
			return block;
		}
		const { id, title, link, metadata } = block.attributes;
		const innerBlocks = convertPageListBlocksToLinks( block.innerBlocks );
		return createBlock(
			innerBlocks.length
				? 'core/navigation-submenu'
				: 'core/navigation-link',
			{
				id,
				label: title,
				url: link,
				type: 'page',
				kind: 'post-type',
				metadata: {
					...( metadata?.blockVisibility === false && {
						blockVisibility: false,
					} ),
					bindings: PAGE_LINK_BINDINGS,
				},
			},
			innerBlocks
		);
	} );
}

/**
 * Returns a function that detaches a Page List: replaces it with links to its
 * pages, as they're shown in the editor. The menu goes on adding new pages,
 * as the Page List did: its Navigation Menu's `auto_add_pages` setting is
 * turned on, unless the Page List showed only the child pages of one page.
 *
 * @param options                Options.
 * @param options.clientId       Client ID of the Page List block.
 * @param options.parentClientId Client ID of the Navigation block.
 *
 * @return Detaches the Page List. Pages moved out of it, by client ID, become
 * links in the same step.
 */
export function useConvertToNavigationLinks( {
	clientId,
	parentClientId,
}: {
	clientId: string;
	parentClientId?: string;
} ) {
	const registry = useRegistry();

	return ( movedOutClientIds: string[] = [] ) => {
		const { getBlocks, getBlocksByClientId, getBlockAttributes } =
			registry.select( blockEditorStore ) as any;
		const { replaceBlock, selectBlock } = registry.dispatch(
			blockEditorStore
		) as any;
		const navigationLinks = convertPageListBlocksToLinks(
			getBlocks( clientId )
		);
		const showsAllPages = ! getBlockAttributes( clientId )?.parentPageID;

		registry.batch( () => {
			( getBlocksByClientId( movedOutClientIds ) as BlockInstance[] )
				.filter( Boolean )
				.forEach( ( block ) =>
					replaceBlock(
						block.clientId,
						convertPageListBlocksToLinks( [ block ] )
					)
				);
			// Replace the Page List block with the Navigation Links.
			replaceBlock( clientId, navigationLinks );
		} );

		const menuId = parentClientId
			? getBlockAttributes( parentClientId )?.ref
			: undefined;
		if ( menuId && showsAllPages ) {
			const { meta } = (
				registry.select( coreStore ) as any
			 ).getEditedEntityRecord( 'postType', 'wp_navigation', menuId );
			( registry.dispatch( coreStore ) as any ).editEntityRecord(
				'postType',
				'wp_navigation',
				menuId,
				{ meta: { ...meta, auto_add_pages: true } }
			);
		}

		// Select the Navigation block to reveal the changes.
		if ( parentClientId ) {
			selectBlock( parentClientId );
		}
	};
}
