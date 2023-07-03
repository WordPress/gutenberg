/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Converts an array of pages into a nested array of navigation link blocks.
 *
 * @param {Array} pages An array of pages.
 *
 * @return {Array} A nested array of navigation link blocks.
 */
function createNavigationLinks( pages = [] ) {
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
				kind: 'post-type',
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
