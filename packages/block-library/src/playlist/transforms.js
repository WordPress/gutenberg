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
				block.innerBlocks.length === 1 &&
				block.innerBlocks[ 0 ].name === 'core/playlist-track',
			transform: ( { style, ...attributes }, [ track ] ) =>
				createBlock( 'core/audio', {
					...attributes,
					...( style?.spacing && {
						style: { spacing: style.spacing },
					} ),
					blob: track.attributes.blob,
					id: track.attributes.id,
					src: track.attributes.src,
				} ),
		},
	],
};

export default transforms;
