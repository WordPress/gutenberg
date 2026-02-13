/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/post-comments-link' ],
			transform: ( { style } ) => {
				const textAlign = style?.typography?.textAlign;
				return createBlock( 'core/post-comments-link', {
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
