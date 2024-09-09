/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { getFilename } from '@wordpress/url';

const transforms = {
	from: [
		{
			type: 'files',
			isMatch( files ) {
				return files.length > 0;
			},
			// We define a lower priorty (higher number) than the default of 10. This
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
							} )
						);
					}
				} );

				return blocks;
			},
		},
		{
			type: 'block',
			blocks: [ 'core/audio' ],
			transform: ( attributes ) => {
				return createBlock( 'core/file', {
					href: attributes.src,
					fileName: attributes.caption,
					textLinkHref: attributes.src,
					id: attributes.id,
					anchor: attributes.anchor,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/video' ],
			transform: ( attributes ) => {
				return createBlock( 'core/file', {
					href: attributes.src,
					fileName: attributes.caption,
					textLinkHref: attributes.src,
					id: attributes.id,
					anchor: attributes.anchor,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/image' ],
			transform: ( attributes ) => {
				return createBlock( 'core/file', {
					href: attributes.url,
					fileName:
						attributes.caption || getFilename( attributes.url ),
					textLinkHref: attributes.url,
					id: attributes.id,
					anchor: attributes.anchor,
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
				const { getMedia } = select( coreStore );
				const media = getMedia( id );
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
				const { getMedia } = select( coreStore );
				const media = getMedia( id );
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
				const { getMedia } = select( coreStore );
				const media = getMedia( id );
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
