/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/list' ],
			transform: ( attributes ) => {
				const { style, fontFamily } = attributes;
				const pages = select( coreStore ).getEntityRecords(
					'postType',
					'page',
					{
						per_page: 100,
						status: 'publish',
						orderBy: 'menu_order',
						order: 'asc',
						_fields: [
							'id',
							'link',
							'parent',
							'title',
							'menu_order',
						],
					}
				);

				if ( ! pages || pages.length === 0 ) {
					return createBlock( 'core/list', {} );
				}

				const createListItems = ( parentId = 0 ) => {
					return pages
						.filter( ( page ) => page.parent === parentId )
						.map( ( page ) => {
							const childItems = createListItems( page.id );
							const listItem = createBlock( 'core/list-item', {
								content: `<a href="${ page.link }">${ page.title.rendered }</a>`,
							} );
							if ( childItems.length > 0 ) {
								const subList = createBlock(
									'core/list',
									{},
									childItems
								);
								listItem.innerBlocks = [ subList ];
							}
							return listItem;
						} );
				};

				const innerBlocks = createListItems();

				return createBlock(
					'core/list',
					{
						style,
						fontFamily,
					},
					innerBlocks
				);
			},
		},
	],
};

export default transforms;
