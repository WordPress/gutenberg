import { createBlock } from '@wordpress/blocks';
import { useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { buildNavigationLinkEntityBinding } from '../navigation-link/shared';

const PAGE_LIST_ITEM = 'core/page-list-item';

/**
 * Converts an array of pages into a nested array of navigation link blocks.
 *
 * @param {Array} pages An array of pages.
 *
 * @return {Array} A nested array of navigation link blocks.
 */
function createNavigationLinks( pages = [] ) {
	const POST_TYPE_KIND = 'post-type';
	const linkMap = {};
	const navigationLinks = [];
	pages.forEach( ( { id, title, link: url, type, parent } ) => {
		// See if a placeholder exists. This is created if children appear before parents in list.
		const innerBlocks = linkMap[ id ]?.innerBlocks ?? [];
		linkMap[ id ] = createBlock(
			'core/navigation-link',
			{
				id,
				label: title.rendered,
				url,
				type,
				kind: POST_TYPE_KIND,
				metadata: {
					bindings:
						buildNavigationLinkEntityBinding( POST_TYPE_KIND ),
				},
			},
			innerBlocks
		);

		if ( ! parent ) {
			navigationLinks.push( linkMap[ id ] );
		} else {
			if ( ! linkMap[ parent ] ) {
				// Use a placeholder if the child appears before parent in list.
				linkMap[ parent ] = { innerBlocks: [] };
			}
			// Although these variables are not referenced, they are needed to store the innerBlocks in memory.
			const parentLinkInnerBlocks = linkMap[ parent ].innerBlocks;
			parentLinkInnerBlocks.push( linkMap[ id ] );
		}
	} );

	return navigationLinks;
}

/**
 * Finds a navigation link block by id, recursively.
 * It might be possible to make this a more generic helper function.
 *
 * @param {Array}  navigationLinks An array of navigation link blocks.
 * @param {number} id              The id of the navigation link to find.
 *
 * @return {Object|null} The navigation link block with the given id.
 */
function findNavigationLinkById( navigationLinks, id ) {
	for ( const navigationLink of navigationLinks ) {
		// Is this the link we're looking for?
		if ( navigationLink.attributes.id === id ) {
			return navigationLink;
		}

		// If not does it have innerBlocks?
		if ( navigationLink.innerBlocks && navigationLink.innerBlocks.length ) {
			const foundNavigationLink = findNavigationLinkById(
				navigationLink.innerBlocks,
				id
			);

			if ( foundNavigationLink ) {
				return foundNavigationLink;
			}
		}
	}

	return null;
}

export function convertToNavigationLinks( pages = [], parentPageID = null ) {
	let navigationLinks = createNavigationLinks( pages );

	// If a parent page ID is provided, only return the children of that page.
	if ( parentPageID ) {
		const parentPage = findNavigationLinkById(
			navigationLinks,
			parentPageID
		);
		if ( parentPage && parentPage.innerBlocks ) {
			navigationLinks = parentPage.innerBlocks;
		}
	}

	// Transform all links with innerBlocks into Submenus. This can't be done
	// sooner because page objects have no information on their children.
	const transformSubmenus = ( listOfLinks ) => {
		listOfLinks.forEach( ( block, index, listOfLinksArray ) => {
			const { attributes, innerBlocks } = block;
			if ( innerBlocks.length !== 0 ) {
				transformSubmenus( innerBlocks );
				const transformedBlock = createBlock(
					'core/navigation-submenu',
					attributes,
					innerBlocks
				);
				listOfLinksArray[ index ] = transformedBlock;
			}
		} );
	};

	transformSubmenus( navigationLinks );
	return navigationLinks;
}

/**
 * Turns the blocks of a Page List into Navigation Link and Submenu blocks, as
 * they're shown: in their order and at their levels. A hidden page becomes a
 * hidden link, and any other item put among the pages stays where it is.
 *
 * @param {Array} blocks The Page List's inner blocks.
 *
 * @return {Array} Navigation Link and Submenu blocks.
 */
export function convertPageListBlocksToLinks( blocks = [] ) {
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
					bindings: buildNavigationLinkEntityBinding( 'post-type' ),
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
 * @param {Object} options
 * @param {string} options.clientId       Client ID of the Page List block.
 * @param {string} options.parentClientId Client ID of the Navigation block.
 *
 * @return {(movedOutClientIds?: string[]) => void} Detaches the Page List.
 * Pages moved out of it, by client ID, become links in the same step.
 */
export function useConvertToNavigationLinks( { clientId, parentClientId } ) {
	const registry = useRegistry();

	return ( movedOutClientIds = [] ) => {
		const { getBlocks, getBlocksByClientId, getBlockAttributes } =
			registry.select( blockEditorStore );
		const { replaceBlock, selectBlock } =
			registry.dispatch( blockEditorStore );
		const navigationLinks = convertPageListBlocksToLinks(
			getBlocks( clientId )
		);

		registry.batch( () => {
			getBlocksByClientId( movedOutClientIds )
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

		const menuId =
			parentClientId && getBlockAttributes( parentClientId )?.ref;
		if ( menuId && ! getBlockAttributes( clientId )?.parentPageID ) {
			const { meta } = registry
				.select( coreStore )
				.getEditedEntityRecord( 'postType', 'wp_navigation', menuId );
			registry
				.dispatch( coreStore )
				.editEntityRecord( 'postType', 'wp_navigation', menuId, {
					meta: { ...meta, auto_add_pages: true },
				} );
		}

		// Select the Navigation block to reveal the changes.
		if ( parentClientId ) {
			selectBlock( parentClientId );
		}
	};
}
