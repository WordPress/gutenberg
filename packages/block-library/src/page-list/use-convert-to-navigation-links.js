import { createBlock } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { buildNavigationLinkEntityBinding } from '../navigation-link/shared';

/**
 * Converts an array of pages into a nested array of navigation link blocks.
 *
 * @param {Array} pages An array of pages.
 *
 * @return {Object} The top-level navigation link blocks (`navigationLinks`),
 *                  and every link by page ID (`linkMap`), including pages
 *                  whose parent isn't among the pages.
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
				label:
					// translators: displayed when a page has an empty title.
					title.rendered.trim() !== ''
						? title.rendered
						: __( '(no title)' ),
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

	return { navigationLinks, linkMap };
}

export function convertToNavigationLinks( pages = [], parentPageID = null ) {
	const { navigationLinks: topLevelLinks, linkMap } =
		createNavigationLinks( pages );
	let navigationLinks = topLevelLinks;

	// If a parent page ID is provided, only return the children of that page.
	// Look it up by ID, since it may sit under a page that isn't among the
	// pages (one that isn't published).
	if ( parentPageID ) {
		navigationLinks = linkMap[ parentPageID ]?.innerBlocks ?? [];
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
