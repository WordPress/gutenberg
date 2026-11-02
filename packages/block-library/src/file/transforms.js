import { createBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { getFilename } from '@wordpress/url';
import { createDownloadButtons } from './utils';

// The File → audio/video/image transforms are identical apart from the target
// block, its media MIME type, and the src attribute name (image uses `url`).
const toMediaTransform = ( blockName, mediaType, srcAttribute ) => ( {
	type: 'block',
	blocks: [ blockName ],
	isMatch: ( { id } ) => {
		if ( ! id ) {
			return false;
		}
		const { getEntityRecord } = select( coreStore );
		const media = getEntityRecord( 'postType', 'attachment', id, {
			context: 'view',
		} );
		return !! media && media.mime_type.includes( mediaType );
	},
	transform: ( attributes ) => {
		return createBlock( blockName, {
			[ srcAttribute ]: attributes.href,
			caption: attributes.fileName,
			id: attributes.id,
			anchor: attributes.anchor,
		} );
	},
} );

const transforms = {
	from: [
		{
			type: 'files',
			isMatch( files ) {
				return files.length > 0;
			},
			// We define a lower priority (higher number) than the default of 10. This
			// ensures that the File block is only created as a fallback.
			priority: 15,
			transform: ( files ) => {
				const blocks = [];

				files.forEach( ( file ) => {
					const blobURL = createBlobURL( file );

					// File will be uploaded in componentDidMount()
					if ( file.type.startsWith( 'video/' ) ) {
						blocks.push(
							createBlock( 'core/video', {
								blob: createBlobURL( file ),
							} )
						);
					} else if ( file.type.startsWith( 'image/' ) ) {
						blocks.push(
							createBlock( 'core/image', {
								blob: createBlobURL( file ),
							} )
						);
					} else if ( file.type.startsWith( 'audio/' ) ) {
						blocks.push(
							createBlock( 'core/audio', {
								blob: createBlobURL( file ),
							} )
						);
					} else {
						// The upload sets the URL of the download button.
						blocks.push(
							createBlock(
								'core/file',
								{
									blob: blobURL,
									fileName: file.name,
								},
								[ createDownloadButtons( {} ) ]
							)
						);
					}
				} );

				return blocks;
			},
		},
		{
			type: 'block',
			blocks: [ 'core/audio', 'core/video', 'core/image' ],
			transform: ( attributes ) => {
				// Audio/Video use `src`, Image uses `url`.
				const href = attributes.src ?? attributes.url;
				return createBlock(
					'core/file',
					{
						href,
						fileName: attributes.caption || getFilename( href ),
						textLinkHref: href,
						id: attributes.id,
						anchor: attributes.anchor,
					},
					[ createDownloadButtons( { url: href } ) ]
				);
			},
		},
	],
	to: [
		toMediaTransform( 'core/audio', 'audio', 'src' ),
		toMediaTransform( 'core/video', 'video', 'src' ),
		toMediaTransform( 'core/image', 'image', 'url' ),
	],
};

export default transforms;
