/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { getFilename } from '@wordpress/url';

const getPlaylistAttributes = ( { align, anchor, caption, style } ) => ( {
	caption,
	...( align && { align } ),
	...( anchor && { anchor } ),
	...( style?.spacing && {
		style: { spacing: style.spacing },
	} ),
} );

const createPlaylistTrack = ( { blob, id, src } ) =>
	createBlock( 'core/playlist-track', {
		blob,
		src,
		...( src && { title: getFilename( src ) } ),
		...( id !== undefined && { id } ),
	} );

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/audio' ],
			transform: ( attributes ) =>
				createBlock(
					'core/playlist',
					{ ...attributes[ 0 ] },
					attributes.map( ( { blob, id, src } ) =>
						createBlock( 'core/playlist-track', {
							blob,
							id,
							src,
							title: getFilename( src ),
						} )
					)
				),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/audio' ],
			isMatch: ( {}, block ) =>
				block.innerBlocks.length === 1 &&
				block.innerBlocks[ 0 ].name === 'core/playlist-track',
			transform: (
				{ align, anchor, caption, style },
				[
					{
						attributes: { blob, id, src },
					},
				]
			) =>
				createBlock( 'core/audio', {
					blob,
					src,
					caption,
					...( align && { align } ),
					...( anchor && { anchor } ),
					...( style?.spacing && {
						style: { spacing: style.spacing },
					} ),
					...( id !== undefined && { id } ),
				} ),
		},
	],
};

export default transforms;
