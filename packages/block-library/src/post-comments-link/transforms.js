/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/post-comments-count' ],
			transform: ( { style } ) => {
				const textAlign = style?.typography?.textAlign;
				return createBlock( 'core/post-comments-count', {
					...( textAlign && {
						style: {
							typography: {
								textAlign,
							},
						},
					} ),
				} );
			},
		},
	],
};

export default transforms;
