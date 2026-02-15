/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/site-title' ],
			transform: ( { isLink, linkTarget, style } ) => {
				const textAlign = style?.typography?.textAlign;
				return createBlock( 'core/site-title', {
					isLink,
					linkTarget,
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
