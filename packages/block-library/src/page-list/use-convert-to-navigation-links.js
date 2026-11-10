import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
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
	const index = links.findIndex( ( link ) => link.attributes.id === pageId );
	if ( index !== -1 ) {
		links.splice( index + 1, 0, block );
		return true;
	}
	return links.some( ( link ) =>
		insertAfterPageLink( link.innerBlocks, pageId, block )
	);
}

/**
 * Returns a function that adds a link after one of a Page List's pages.
 *
 * A link can't go between two pages of a Page List, so adding one there turns
 * the pages into links first, as Detach does: in the order shown, without
 * hidden pages. The new link is selected, which opens its search.
 *
 * @param {string|undefined} clientId Client ID of the Page List block.
 *
 * @return {(pageId: number) => void} Called with a page ID.
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
	const { replaceBlock, selectBlock } = useDispatch( blockEditorStore );

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
		selectBlock( link.clientId );
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
	};
}
