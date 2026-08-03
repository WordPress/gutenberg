/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { getFilename } from '@wordpress/url';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/audio' ],
			transform: ( { align, anchor, blob, caption, id, src, style } ) =>
				createBlock(
					'core/playlist',
					{
						caption,
						...( align && { align } ),
						...( anchor && { anchor } ),
						...( style?.spacing && {
							style: { spacing: style.spacing },
						} ),
					},
					[
						createBlock( 'core/playlist-track', {
							blob,
							src,
							...( src && { title: getFilename( src ) } ),
							...( id !== undefined && { id } ),
						} ),
					]
				),
		},
	],
};

export default transforms;
