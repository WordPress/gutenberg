/**
 * WordPress dependencies
 */
import { createBlock, getBlockAttributes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { name } from './block.json';

const transforms = {
	from: [
		{
			type: 'raw',
			// Paragraph is a fallback and should be matched last.
			priority: 20,
			selector: 'p',
			schema: ( { phrasingContentSchema, isPaste } ) => ( {
				p: {
					children: phrasingContentSchema,
					attributes: isPaste ? [] : [ 'style' ],
				},
			} ),
			transform( node ) {
				const attributes = getBlockAttributes( name, node.outerHTML );
				const align = node.style.textAlign;

				if (
					align === 'left' ||
					align === 'center' ||
					align === 'right'
				) {
					return createBlock( name, { ...attributes, align } );
				}

				return createBlock( name, attributes );
			},
		},
	],
};

export default transforms;
