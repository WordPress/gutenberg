import { createBlock, getBlockAttributes } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';

/**
 * Returns the terms and descriptions of a `dl` element, including those
 * grouped in `div` wrappers, which the HTML spec allows.
 *
 * @param node The `dl` element.
 *
 * @return The `dt` and `dd` elements in document order.
 */
function getDescriptionListItems( node: Element ) {
	return Array.from( node.children )
		.flatMap( ( child ) =>
			child.tagName === 'DIV' ? Array.from( child.children ) : [ child ]
		)
		.filter(
			( child ) => child.tagName === 'DT' || child.tagName === 'DD'
		);
}

const transforms: BlockType[ 'transforms' ] = {
	from: [
		{
			type: 'raw',
			selector: 'dl',
			schema: ( { phrasingContentSchema } ) => ( {
				dl: {
					children: {
						dt: { children: phrasingContentSchema },
						dd: { children: phrasingContentSchema },
					},
				},
			} ),
			transform: ( node ) =>
				createBlock(
					'core/description-list',
					{},
					getDescriptionListItems( node ).map( ( item ) => {
						const blockName =
							item.tagName === 'DT'
								? 'core/description-term'
								: 'core/description-detail';
						return createBlock(
							blockName,
							getBlockAttributes( blockName, item.outerHTML )
						);
					} )
				),
		},
	],
};

export default transforms;
