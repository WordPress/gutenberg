import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { usePageListPages } from './use-page-list-pages';
import { getPageTitle, getVisiblePages } from './utils';
import { buildNavigationLinkEntityBinding } from '../navigation-link/shared';

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

export function useConvertToNavigationLinks( {
	clientId,
	pages,
	parentClientId,
	parentPageID,
} ) {
	const { replaceBlock, selectBlock } = useDispatch( blockEditorStore );

	return () => {
		const navigationLinks = convertToNavigationLinks( pages, parentPageID );

		// Replace the Page List block with the Navigation Links.
		replaceBlock( clientId, navigationLinks );

		// Select the Navigation block to reveal the changes.
		selectBlock( parentClientId );
	};
}

/**
 * Puts blocks straight before or after the link to a page, at the same level,
 * in a tree of links that isn't in the editor yet.
 *
 * @param {Array}   links   Navigation Link and Submenu blocks.
 * @param {number}  pageId  ID of the page to put the blocks next to.
 * @param {Array}   blocks  The blocks to add.
 * @param {boolean} isAfter Whether they go after the page, not before it.
 *
 * @return {boolean} Whether the page's link was found.
 */
export function insertNextToPageLink( links, pageId, blocks, isAfter ) {
	const index = links.findIndex( ( link ) => link.attributes.id === pageId );
	if ( index !== -1 ) {
		links.splice( isAfter ? index + 1 : index, 0, ...blocks );
		return true;
	}
	return links.some( ( link ) =>
		insertNextToPageLink( link.innerBlocks, pageId, blocks, isAfter )
	);
}

/**
 * Puts a block straight after the link to a page, at the same level, in a
 * tree of links that isn't in the editor yet.
 *
 * @param {Array}  links  Navigation Link and Submenu blocks.
 * @param {number} pageId ID of the page to add the block after.
 * @param {Object} block  The block to add.
 *
 * @return {boolean} Whether the page's link was found.
 */
export function insertAfterPageLink( links, pageId, block ) {
	return insertNextToPageLink( links, pageId, [ block ], true );
}

/**
 * Takes the link to a page, with the links to its child pages, out of a tree
 * of links that isn't in the editor yet.
 *
 * @param {Array}  links  Navigation Link and Submenu blocks.
 * @param {number} pageId ID of the page.
 *
 * @return {Object|null} The page's link, or null if it isn't there.
 */
export function removePageLink( links, pageId ) {
	const index = links.findIndex( ( link ) => link.attributes.id === pageId );
	if ( index !== -1 ) {
		return links.splice( index, 1 )[ 0 ];
	}
	for ( const link of links ) {
		const removed = removePageLink( link.innerBlocks, pageId );
		if ( removed ) {
			return removed;
		}
	}
	return null;
}

/**
 * Returns a function that adds a link after one of a Page List's pages.
 *
 * A link can't go between two pages of a Page List, so adding one there turns
 * the pages into links first, as Detach does: in the order shown, without
 * hidden pages. The new link isn't selected, so the caller can open its
 * search where it was added from.
 *
 * @param {string|undefined} clientId Client ID of the Page List block.
 *
 * @return {(pageId: number) => string|undefined} Called with a page ID, and
 *                                                returns the new link's
 *                                                client ID.
 */
export function useAddLinkAfterPage( clientId ) {
	const { pagesByParentId } = usePageListPages();
	const attributes = useSelect(
		( select ) =>
			clientId
				? select( blockEditorStore ).getBlockAttributes( clientId )
				: null,
		[ clientId ]
	);
	const { replaceBlock } = useDispatch( blockEditorStore );

	return ( pageId ) => {
		if ( ! clientId || ! attributes ) {
			return;
		}
		const excludedIds = new Set(
			Array.isArray( attributes.excludedPageIDs )
				? attributes.excludedPageIDs
				: []
		);
		const visiblePages = getVisiblePages( pagesByParentId, excludedIds );
		const links = convertToNavigationLinks(
			visiblePages,
			attributes.parentPageID
		);
		const link = createBlock( 'core/navigation-link' );
		if ( ! insertAfterPageLink( links, pageId, link ) ) {
			return;
		}
		replaceBlock( clientId, links );
		const page = visiblePages.find( ( { id } ) => id === pageId );
		speak(
			sprintf(
				/* translators: %s: Page title. */
				__(
					'The pages are now links, and a new link was added after %s.'
				),
				page ? getPageTitle( page ) : ''
			)
		);
		return link.clientId;
	};
}

/**
 * Returns functions that move items in and out of a Page List by dragging.
 * A Page List can't hold other links, and its pages can't sit between other
 * links, so either move turns the pages into links first, as Detach does:
 * in the order shown, without hidden pages.
 *
 * @param {string|undefined} clientId Client ID of the Page List block.
 *
 * @return {{
 *   dropBlocksNextToPage: (blockClientIds: string[], pageId: number, isAfter: boolean) => void,
 *   dropPageNextToBlock: (pageId: number, targetClientId: string, isAfter: boolean) => void,
 * }} Called when the drop happens.
 */
export function useDropIntoOrOutOfPageList( clientId ) {
	const registry = useRegistry();
	const { pagesByParentId } = usePageListPages();
	const { replaceBlock, removeBlock, removeBlocks, insertBlock } =
		useDispatch( blockEditorStore );

	const getLinks = () => {
		const attributes =
			clientId &&
			registry.select( blockEditorStore ).getBlockAttributes( clientId );
		if ( ! attributes ) {
			return null;
		}
		const excludedIds = new Set(
			Array.isArray( attributes.excludedPageIDs )
				? attributes.excludedPageIDs
				: []
		);
		return convertToNavigationLinks(
			getVisiblePages( pagesByParentId, excludedIds ),
			attributes.parentPageID
		);
	};

	// Another item of the menu, dropped next to one of the pages.
	const dropBlocksNextToPage = ( blockClientIds, pageId, isAfter ) => {
		const links = getLinks();
		const blocks = registry
			.select( blockEditorStore )
			.getBlocksByClientId( blockClientIds )
			.filter( Boolean );
		if (
			! links ||
			! blocks.length ||
			! insertNextToPageLink( links, pageId, blocks, isAfter )
		) {
			return;
		}
		registry.batch( () => {
			removeBlocks( blockClientIds, false );
			replaceBlock( clientId, links );
		} );
		speak( __( 'The pages are now links, and the item was moved.' ) );
	};

	// One of the pages, dropped next to another item of the menu.
	const dropPageNextToBlock = ( pageId, targetClientId, isAfter ) => {
		const links = getLinks();
		const pageLink = links && removePageLink( links, pageId );
		if ( ! pageLink ) {
			return;
		}
		registry.batch( () => {
			if ( links.length ) {
				replaceBlock( clientId, links );
			} else {
				removeBlock( clientId, false );
			}
			const { getBlockIndex, getBlockRootClientId } =
				registry.select( blockEditorStore );
			insertBlock(
				pageLink,
				getBlockIndex( targetClientId ) + ( isAfter ? 1 : 0 ),
				getBlockRootClientId( targetClientId ),
				false
			);
		} );
		speak( __( 'The pages are now links, and the page was moved.' ) );
	};

	return { dropBlocksNextToPage, dropPageNextToBlock };
}
