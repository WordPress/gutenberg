/**
 * WordPress dependencies
 */
import {
	createBlock,
	getBlockAttributes,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getLevelFromHeadingNodeName } from './shared';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( { content } ) => {
				return createBlock( 'core/heading', {
					content,
				} );
			},
		},
		{
			type: 'raw',
			selector: 'h1,h2,h3,h4,h5,h6',
			schema: ( { phrasingContentSchema } ) => ( {
				h1: { children: phrasingContentSchema },
				h2: { children: phrasingContentSchema },
				h3: { children: phrasingContentSchema },
				h4: { children: phrasingContentSchema },
				h5: { children: phrasingContentSchema },
				h6: { children: phrasingContentSchema },
			} ),
			transform( node ) {
				return createBlock( 'core/heading', {
					...getBlockAttributes(
						'core/heading',
						node.outerHTML
					),
					level: getLevelFromHeadingNodeName( node.nodeName ),
				} );
			},
		},
		...[ 2, 3, 4, 5, 6 ].map( ( level ) => ( {
			type: 'prefix',
			prefix: Array( level + 1 ).join( '#' ),
			transform( content ) {
				return createBlock( 'core/heading', {
					level,
					content,
				} );
			},
		} ) ),
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( { content } ) => {
				return createBlock( 'core/paragraph', {
					content,
				} );
			},
		},
	],
};

export default transforms;
