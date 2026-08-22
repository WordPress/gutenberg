import { createBlock } from '@wordpress/blocks';
import { getFilename } from '@wordpress/url';

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
				block.innerBlocks.length > 0 &&
				block.innerBlocks.every(
					( { name } ) => name === 'core/playlist-track'
				),
			transform: ( { style, ...attributes }, tracks ) => {
				const { anchor, caption, ...attributesWithoutContent } =
					attributes;
				const hasMultipleTracks = tracks.length > 1;

				return tracks.map( ( track ) =>
					createBlock( 'core/audio', {
						...( hasMultipleTracks
							? attributesWithoutContent
							: attributes ),
						...( style?.spacing && {
							style: { spacing: style.spacing },
						} ),
						blob: track.attributes.blob,
						id: track.attributes.id,
						src: track.attributes.src,
					} )
				);
			},
		},
	],
};

export default transforms;
