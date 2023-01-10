/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

export const convertToNavigationLinks = ( pages ) => {
	if ( ! pages ) {
		return;
	}

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
			const parentLinkInnerBlocks = linkMap[ parent ].innerBlocks;
			parentLinkInnerBlocks.push( linkMap[ id ] );
		}
	} );

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
};
