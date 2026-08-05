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
			blocks: [ 'core/audio' ],
			transform: ( audio ) => {
				return createBlock(
					'core/playlist',
					getPlaylistAttributes( audio ),
					[ createPlaylistTrack( audio ) ]
				);
			},
		},
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/audio' ],
			transform: ( attributes ) => {
				const [ firstAudio ] = attributes;
				return createBlock(
					'core/playlist',
					getPlaylistAttributes( firstAudio ),
					attributes.map( createPlaylistTrack )
				);
			},
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
