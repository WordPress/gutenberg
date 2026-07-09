/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { _x } from '@wordpress/i18n';
import { getFilename } from '@wordpress/url';

// Transforms bypass the default variation, so set the localized default here.
const downloadButtonText = _x( 'Download', 'button label' );

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
						blocks.push(
							createBlock( 'core/file', {
								blob: blobURL,
								fileName: file.name,
								downloadButtonText,
							} )
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
				return createBlock( 'core/file', {
					href,
					fileName: attributes.caption || getFilename( href ),
					textLinkHref: href,
					id: attributes.id,
					anchor: attributes.anchor,
					downloadButtonText,
				} );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/audio' ],
			isMatch: ( { id } ) => {
				if ( ! id ) {
					return false;
				}
				const { getEntityRecord } = select( coreStore );
				const media = getEntityRecord( 'postType', 'attachment', id );
				return !! media && media.mime_type.includes( 'audio' );
			},
			transform: ( attributes ) => {
				return createBlock( 'core/audio', {
					src: attributes.href,
					caption: attributes.fileName,
					id: attributes.id,
					anchor: attributes.anchor,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/video' ],
			isMatch: ( { id } ) => {
				if ( ! id ) {
					return false;
				}
				const { getEntityRecord } = select( coreStore );
				const media = getEntityRecord( 'postType', 'attachment', id );
				return !! media && media.mime_type.includes( 'video' );
			},
			transform: ( attributes ) => {
				return createBlock( 'core/video', {
					src: attributes.href,
					caption: attributes.fileName,
					id: attributes.id,
					anchor: attributes.anchor,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/image' ],
			isMatch: ( { id } ) => {
				if ( ! id ) {
					return false;
				}
				const { getEntityRecord } = select( coreStore );
				const media = getEntityRecord( 'postType', 'attachment', id );
				return !! media && media.mime_type.includes( 'image' );
			},
			transform: ( attributes ) => {
				return createBlock( 'core/image', {
					url: attributes.href,
					caption: attributes.fileName,
					id: attributes.id,
					anchor: attributes.anchor,
				} );
			},
		},
	],
};

export default transforms;
